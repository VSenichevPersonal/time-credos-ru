// F-E — детект «кто не заполнил таймшит за текущую неделю» (напоминания).
//
// ЧИСТЫЙ модуль (без SDK/fetch) — тестируется изолированно, переиспользуется
// HTTP-роутом /s/reminders (mode=missing-timesheets) и будущим cron-доставщиком.
//
// ЗАЧЕМ отдельный детект, а не доставка в lambda: SDK песочницы НЕ даёт нативного
// механизма уведомлений (нет sendEmail/sendNotification из logic-function; cron-
// триггер есть, но payload не документирован и канал доставки отсутствует — см.
// SIGNALS «Dev 2 → arch»). Поэтому строим чистую детект-функцию: UI-баннер
// «Мои часы» / дайджест руководителю питаются от неё. Доставка (push/email) —
// follow-up, когда появится канал.
//
// СВЕРКА (правило 8): Timetta — таймшит заполняется за период (неделя/месяц,
// settings-time-accounting-timesheet-periods), «незаполненный» = факт < нормы
// периода; система напоминает заполнить/отправить. Зеркалим: недобор = норма−факт
// за ТЕКУЩУЮ неделю, порог настраиваемый. Не переусложняем: одна неделя, без
// истории/эскалаций (это follow-up).
//
// Норма сотрудника за неделю считается ТАК ЖЕ, как в reports-calc (SSOT-принцип):
//   личная норма = Σ часов рабочих дней календаря недели × capacityFactor отдела
//                  − часы отсутствий сотрудника в эти дни.
// Капасити-фактор отдела (как в reports byEmployee) — если у отдела не задан,
// fallback 1 (полная ставка). Сотрудники без отдела → фактор 1.

import {
  WORKDAY_TYPES,
  type RawAbsence,
  type RawCalendarDay,
  type RawDepartment,
  type RawEmployee,
  type RawEntry,
} from './reports-calc';

// Входные данные детекта (подмножество ReportsInput — только нужное).
export type MissingInput = {
  entries: RawEntry[];
  employees: RawEmployee[];
  departments: RawDepartment[];
  calendar: RawCalendarDay[];
  absences?: RawAbsence[];
};

export type MissingOptions = {
  // Порог «недозаполнения» в долях нормы: запись попадает в список, если
  // факт < норма × (1 − slack). 0 = строго (любой недобор), 0.1 = допускаем 10%.
  // Дефолт 0 (строго любой недобор) — Timetta-подобно (период должен быть закрыт).
  fillThreshold?: number;
  // Минимальная норма недели (ч), ниже которой сотрудника не напоминаем
  // (целиком отпускная/праздничная неделя norm≈0 → напоминать не о чем).
  minWeekNorm?: number;
  // CISO-007: раскрывать ФИО (revealEmployeeNames). false → name пустой.
  revealNames?: boolean;
};

// Строка результата: адресная — employeeId всегда, ФИО по правилу revealNames.
export type MissingRow = {
  employeeId: string;
  name: string; // ФИО или '' (CISO-007)
  deptCode: string; // код отдела или ''
  norm: number; // норма недели (ч)
  fact: number; // факт недели (ч)
  under: number; // недобор = norm − fact (>0)
};

export type MissingResult = {
  week: { from: string; to: string }; // YYYY-MM-DD..YYYY-MM-DD (включительно)
  threshold: number;
  total: number; // сколько сотрудников недозаполнили
  rows: MissingRow[]; // отсортированы по убыванию недобора
};

const dayKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

const round2 = (n: number): number => Number(n.toFixed(2));

// Границы текущей недели от опорной даты. weekStartsOn: 'MONDAY' | 'SUNDAY'.
// Возврат — день (YYYY-MM-DD) начала и конца недели (включительно, 7 дней).
export const weekBounds = (
  ref: Date,
  weekStartsOn: 'MONDAY' | 'SUNDAY',
): { from: string; to: string } => {
  // UTC, чтобы не зависеть от таймзоны песочницы.
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const dow = d.getUTCDay(); // 0=вс..6=сб
  const startOffset = weekStartsOn === 'SUNDAY' ? dow : (dow + 6) % 7; // дней назад до старта
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - startOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
};

// Детект недозаполнивших за неделю [week.from, week.to] (по дням, включительно).
// entries/calendar/absences ОЖИДАЮТСЯ уже ограниченными неделей вызывающим
// (фильтр REST date[gte/lte]); здесь дополнительно режем по дню (защита).
export const computeMissingTimesheets = (
  input: MissingInput,
  week: { from: string; to: string },
  opts: MissingOptions = {},
): MissingResult => {
  const threshold = opts.fillThreshold ?? 0;
  const minWeekNorm = opts.minWeekNorm ?? 0.01;
  const reveal = opts.revealNames === true;

  const deptById = new Map(input.departments.map((d) => [d.id, d]));

  // Рабочие дни недели (WORKDAY|SHORT) и часы по дню — для нормы и вычета отсутствий.
  const hoursByDay = new Map<string, number>();
  for (const c of input.calendar) {
    if (!WORKDAY_TYPES.has(c.dayType ?? '')) continue;
    const k = dayKey(c.date);
    if (!k || k < week.from || k > week.to) continue;
    hoursByDay.set(k, (hoursByDay.get(k) ?? 0) + (c.hours ?? 0));
  }
  const baseNorm = [...hoursByDay.values()].reduce((s, h) => s + h, 0);

  // Часы отсутствий сотрудника = Σ часов рабочих дней недели в его периодах
  // отсутствия (как в reports-calc).
  const absences = input.absences ?? [];
  const absenceHoursByEmp = new Map<string, number>();
  for (const a of absences) {
    if (!a.employeeId) continue;
    const start = dayKey(a.startDate);
    const end = dayKey(a.endDate) ?? start;
    if (!start) continue;
    let sum = 0;
    for (const [day, h] of hoursByDay) {
      if (day < start) continue;
      if (end && day > end) continue;
      sum += h;
    }
    if (sum > 0)
      absenceHoursByEmp.set(a.employeeId, (absenceHoursByEmp.get(a.employeeId) ?? 0) + sum);
  }

  // Факт сотрудника = Σ часов его записей недели.
  const factByEmp = new Map<string, number>();
  for (const e of input.entries) {
    if (!e.employeeId) continue;
    const k = dayKey(e.date);
    if (!k || k < week.from || k > week.to) continue;
    factByEmp.set(e.employeeId, (factByEmp.get(e.employeeId) ?? 0) + (Number(e.hours) || 0));
  }

  const rows: MissingRow[] = [];
  for (const emp of input.employees) {
    const dept = emp.departmentId ? deptById.get(emp.departmentId) : undefined;
    const capacity = dept?.capacityFactor ?? 1;
    const absHours = absenceHoursByEmp.get(emp.id) ?? 0;
    // Личная норма недели = (базовая × фактор) − отсутствия, не ниже 0.
    const norm = Math.max(0, baseNorm * capacity - absHours);
    if (norm < minWeekNorm) continue; // отпускная/праздничная неделя — не напоминаем
    const fact = factByEmp.get(emp.id) ?? 0;
    // Порог: попадаем, если факт < норма × (1 − threshold).
    if (fact >= norm * (1 - threshold)) continue;
    const name = reveal ? [emp.lastName, emp.firstName].filter(Boolean).join(' ') : '';
    rows.push({
      employeeId: emp.id,
      name,
      deptCode: dept?.code ?? '',
      norm: round2(norm),
      fact: round2(fact),
      under: round2(norm - fact),
    });
  }

  rows.sort((a, b) => b.under - a.under || a.employeeId.localeCompare(b.employeeId));
  return { week, threshold, total: rows.length, rows };
};
