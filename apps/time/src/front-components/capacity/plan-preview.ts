import {
  deptBookingHours,
  deptCapacity,
  deptPlanHoursInPeriod,
  plannedHoursInPeriod,
  projectDeptHoursInPeriod,
  type AbsenceCtx,
  type BookingCtx,
  type PlanSpread,
} from 'src/front-components/capacity/calc-load';
import type {
  CapProject,
  DeptPlan,
  DeptRef,
  Period,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

// WI-11 (Фаза-1 «Планировать»): живое превью раскида плана ДО сохранения.
// Чистый расчёт (без сети/React) — переиспользует plannedHoursInPeriod из WI-05,
// поэтому превью совпадает с тем, что ляжет на доску (раскид по РАБОЧИМ дням).
// Сверка: Timetta resource-plan — диапазон + превью по периодам + строка Σ.

const DAY_MS = 86400000;
const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

// Сумма рабочих часов диапазона [from..to] (включительно) из календаря дня.
const workHoursOf = (hoursByDay: Map<string, number>, from: Date, to: Date): number => {
  let sum = 0;
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    sum += hoursByDay.get(dateKey(new Date(t))) ?? 0;
  }
  return sum;
};

// Понедельник недели, содержащей date (UTC).
const mondayOf = (d: Date): Date => {
  const dow = (d.getUTCDay() + 6) % 7; // 0=пн
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow));
};

// Колонки превью по диапазону [startKey..endKey] (включительно): месяцы или недели.
// Каждая — Period с workHours из производственного календаря. Пустой/невалидный
// диапазон → []. Гранулярность как у доски: короткие проекты читаемее по неделям.
export const previewBuckets = (
  startKey: string,
  endKey: string,
  hoursByDay: Map<string, number>,
  granularity: 'week' | 'month',
): Period[] => {
  if (!startKey || !endKey || endKey < startKey) return [];
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: Period[] = [];
  if (granularity === 'week') {
    let from = mondayOf(start);
    let guard = 0;
    while (from.getTime() <= end.getTime() && guard < 520) {
      const to = new Date(from.getTime() + 6 * DAY_MS);
      out.push({
        key: dateKey(from),
        label: `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]}`,
        from,
        to,
        workHours: workHoursOf(hoursByDay, from, to),
      });
      from = new Date(to.getTime() + DAY_MS);
      guard++;
    }
  } else {
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    let guard = 0;
    while ((y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) && guard < 240) {
      const from = new Date(Date.UTC(y, m, 1));
      const to = new Date(Date.UTC(y, m + 1, 0));
      out.push({
        key: `${y}-${m}`,
        label: `${MONTHS[m]} ${String(y).slice(2)}`,
        from,
        to,
        workHours: workHoursOf(hoursByDay, from, to),
      });
      m++;
      if (m > 11) { m = 0; y++; }
      guard++;
    }
  }
  return out;
};

// Способ выбора масштаба превью: до ~70 дней — недели (детально), иначе месяцы.
export const previewGranularity = (startKey: string, endKey: string): 'week' | 'month' => {
  if (!startKey || !endKey || endKey < startKey) return 'month';
  const days = (Date.parse(endKey) - Date.parse(startKey)) / DAY_MS + 1;
  return days <= 70 ? 'week' : 'month';
};

export type PreviewRow = {
  key: string;
  label: string;
  hours: number; // плановые часы, легшие в период (по рабочим дням)
  // WI-48 W3B.18: ёмкость, с которой сравнивается план = СВОБОДНАЯ ёмкость
  // отдела(ов) периода (полная − занятое другими проектами/планами/HARD-бронями
  // − отсутствия). null = нет отдела/контекста → овербукинг не считается.
  capacity: number | null;
  // WI-48: полная ёмкость отдела(ов) периода (до вычета занятости). Для подписи
  // «свободно X из Y». null когда capacity null.
  fullCapacity: number | null;
  over: boolean; // план периода > СВОБОДНОЙ ёмкости (мягкое предупреждение)
};

export type PreviewResult = {
  rows: PreviewRow[];
  total: number; // Σ раскид (для сверки с plannedEffort)
  maxHours: number; // для масштаба мини-бара
  overCount: number; // WI-48 W3B.21: число периодов с овербукингом (для баннера)
};

// WI-48 W3B.18/22: контекст для расчёта СВОБОДНОЙ ёмкости отдела(ов) в превью.
// Передаётся из UI (уже загружено для доски) — превью считает доступность той же
// логикой, что доска: deptCapacity − занятое ДРУГИМИ проектами/планами/HARD-бронями.
// Все поля опциональны → деградация к прежнему поведению (полная ёмкость).
// Сверка: Timetta resource-plan — доступность = ёмкость минус занятое.
export type PreviewLoadCtx = {
  // Отделы, против ёмкости которых сравнивать. Для мульти-отдельного проекта
  // (REQ-0013) — все долевые отделы; для обычного — один «родной».
  depts: DeptRef[];
  // ВСЕ проекты доски (включая планируемый — он исключается по excludeProjectId,
  // чтобы не вычитать сам себя из свободной ёмкости).
  projects?: CapProject[];
  excludeProjectId?: string;
  deptPlans?: DeptPlan[];
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  absenceCtx?: AbsenceCtx;
  bookingCtx?: BookingCtx;
  // W3B.23: конец горизонта доски (YYYY-MM-DD). Когда ПО пусто — превью тянется
  // сюда (как доска). Без него пустой ПО → превью пустое (back-compat).
  horizonEnd?: string;
};

// Свободная ёмкость набора отделов за период: Σ по отделам (deptCapacity −
// занятое другими проектами − план-загрузки отдела − HARD-брони). Не ниже 0.
// Возвращает { free, full } — full для подписи «свободно из полной».
const freeCapacityOfDepts = (
  ctx: PreviewLoadCtx,
  period: Period,
  spread: PlanSpread,
): { free: number; full: number } => {
  let free = 0;
  let full = 0;
  for (const dept of ctx.depts) {
    if (!(dept.headcount > 0)) continue;
    const cap = deptCapacity(dept, period, ctx.absenceCtx);
    full += cap;
    let occupied = 0;
    for (const p of ctx.projects ?? []) {
      if (p.id === ctx.excludeProjectId) continue;
      occupied += projectDeptHoursInPeriod(p, dept.id, period, ctx.sharesByProject, spread);
    }
    for (const dp of ctx.deptPlans ?? []) {
      if (dp.departmentId === dept.id) occupied += deptPlanHoursInPeriod(dp, period, spread);
    }
    // HARD-брони потребляют ёмкость (как на доске composeCell). SOFT — нет.
    occupied += deptBookingHours(dept, ctx.bookingCtx, period, spread).hard;
    free += Math.max(0, cap - occupied);
  }
  return { free, full };
};

// Живое превью раскида: для диапазона С..ПО считает часы по периодам той же
// формулой, что доска (plannedHoursInPeriod, рабочие дни).
// WI-48 W3B.18/22: овербукинг = план периода > СВОБОДНОЙ ёмкости отдела(ов)
// (deptCapacity минус занятое другими проектами/планами/HARD-бронями), а не
// полной ёмкости одного отдела — иначе конфликт скрыт.
// W3B.23: endKey пустой → раскид/превью до horizonEnd (как доска), не блокируется.
// loadCtx опционален: без него (или совместимый dept-only вызов) — деградация к
// сравнению с ПОЛНОЙ ёмкостью одного отдела (прежнее поведение).
export const computePreview = (
  plannedEffort: number | null,
  startKey: string,
  endKey: string,
  hoursByDay: Map<string, number>,
  deptOrCtx?: DeptRef | PreviewLoadCtx,
): PreviewResult => {
  const loadCtx = isPreviewLoadCtx(deptOrCtx) ? deptOrCtx : undefined;
  const singleDept = isPreviewLoadCtx(deptOrCtx) ? undefined : deptOrCtx;
  // W3B.23: пустой ПО → тянем превью до конца горизонта (если задан в контексте),
  // как делает доска. Иначе диапазон до endKey. effEnd используется и как граница
  // бакетов, и как конец раскида (передаётся в plannedHoursInPeriod как endKey).
  const horizonEnd = loadCtx?.horizonEnd;
  const effEnd = endKey || (horizonEnd ? horizonEnd.slice(0, 10) : '');
  const spread: PlanSpread = { hoursByDay, horizonEnd };

  const granularity = previewGranularity(startKey, effEnd);
  const buckets = previewBuckets(startKey, effEnd, hoursByDay, granularity);

  let total = 0;
  let maxHours = 0;
  let overCount = 0;
  const rows: PreviewRow[] = buckets.map((p) => {
    const hours = plannedHoursInPeriod(plannedEffort, startKey, effEnd, p, spread);
    total += hours;
    if (hours > maxHours) maxHours = hours;

    let capacity: number | null = null;
    let fullCapacity: number | null = null;
    if (loadCtx && loadCtx.depts.some((d) => d.headcount > 0)) {
      const { free, full } = freeCapacityOfDepts(loadCtx, p, spread);
      capacity = free;
      fullCapacity = full;
    } else if (singleDept && singleDept.headcount > 0) {
      // Back-compat: один dept без контекста занятости → полная ёмкость.
      const full = p.workHours * singleDept.headcount * singleDept.capacityFactor;
      capacity = full;
      fullCapacity = full;
    }

    const over = capacity != null && hours > capacity + 0.5;
    if (over) overCount++;
    return { key: p.key, label: p.label, hours, capacity, fullCapacity, over };
  });

  return { rows, total, maxHours, overCount };
};

const isPreviewLoadCtx = (v: DeptRef | PreviewLoadCtx | undefined): v is PreviewLoadCtx =>
  !!v && Array.isArray((v as PreviewLoadCtx).depts);

// WI-48: пакет данных доски (как есть из use-capacity), из которого панель плана
// собирает PreviewLoadCtx под конкретный проект (резолвит долевые отделы W3B.22).
// Один проп вместо плетения 6 значений через цепочку UI. depts здесь — ВСЕ отделы.
export type PreviewSource = {
  depts: DeptRef[];
  projects: CapProject[];
  deptPlans?: DeptPlan[];
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  absenceCtx?: AbsenceCtx;
  bookingCtx?: BookingCtx;
  horizonEnd?: string;
};

// Собрать PreviewLoadCtx под конкретный проект: резолвим долевые отделы (W3B.22),
// проект исключаем из «занятого» (excludeProjectId). null, если отделов нет.
export const previewLoadCtxFor = (
  project: CapProject,
  source: PreviewSource | undefined,
): PreviewLoadCtx | undefined => {
  if (!source) return undefined;
  const depts = previewDeptsForProject(project, source.depts, source.sharesByProject);
  if (depts.length === 0) return undefined;
  return {
    depts,
    projects: source.projects,
    excludeProjectId: project.id,
    deptPlans: source.deptPlans,
    sharesByProject: source.sharesByProject,
    absenceCtx: source.absenceCtx,
    bookingCtx: source.bookingCtx,
    horizonEnd: source.horizonEnd,
  };
};

// WI-48 W3B.22: отделы для сравнения в превью. Мульти-отдельный проект (REQ-0013
// sharesByProject) → все его долевые отделы; иначе — «родной» отдел (по id).
// Возвращает только отделы с известной ёмкостью (headcount > 0 фильтруется выше).
export const previewDeptsForProject = (
  project: CapProject,
  allDepts: DeptRef[],
  sharesByProject?: Map<string, ProjectDeptShare[]>,
): DeptRef[] => {
  const byId = new Map(allDepts.map((d) => [d.id, d]));
  const shares = sharesByProject?.get(project.id);
  if (shares && shares.length > 0) {
    const ids = new Set<string>();
    const out: DeptRef[] = [];
    for (const s of shares) {
      if (!s.departmentId || ids.has(s.departmentId)) continue;
      const d = byId.get(s.departmentId);
      if (d) {
        ids.add(s.departmentId);
        out.push(d);
      }
    }
    if (out.length > 0) return out;
  }
  const own = project.departmentId ? byId.get(project.departmentId) : undefined;
  return own ? [own] : [];
};

// WI-48 W3B.23: валидация диапазона для способа «Равномерно». ПО БОЛЬШЕ НЕ
// обязательна — пусто означает «открытый план» (тянуть до горизонта, как доска).
// Возвращает текст ошибки (для подписи), либо null/подсказку для пустого ПО.
export const validateRange = (
  startKey: string,
  endKey: string,
): string | null => {
  if (!startKey) return 'укажите дату начала «С»';
  if (endKey && endKey < startKey) return 'дата «ПО» раньше «С»';
  return null;
};

// Мягкая подсказка для пустого ПО: план «открытый» — тянется до конца горизонта
// доски. Не ошибка (не блокирует сохранение), отдельно от validateRange.
export const openEndedHint = (endKey: string): string | null =>
  endKey ? null : 'открытый план — раскид до конца горизонта доски';

// WI-47 «Вручную по месяцам»: чистые ф-ции для ручного помесячного раскида.
// Контракт Dev2 (`credos-time-plan-slot`): слот = {periodMonth:'YYYY-MM',
// plannedHours}. UI генерит месяцы диапазона С..ПО и сверяет Σ(слоты) с объёмом.

// Месяцы диапазона [startKey..endKey] (включительно), ключ 'YYYY-MM', метка
// «мес YY» (как в previewBuckets month-режиме). Пустой/невалидный диапазон → [].
// ПО раньше С → []. Guard 240 (20 лет) от зацикливания на битых датах.
export type MonthSlot = { periodMonth: string; label: string };

export const monthsInRange = (startKey: string, endKey: string): MonthSlot[] => {
  if (!startKey || !endKey || endKey < startKey) return [];
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: MonthSlot[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  const endY = end.getUTCFullYear();
  const endM = end.getUTCMonth();
  let guard = 0;
  while ((y < endY || (y === endY && m <= endM)) && guard < 240) {
    out.push({
      periodMonth: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: `${MONTHS[m]} ${String(y).slice(2)}`,
    });
    m++;
    if (m > 11) { m = 0; y++; }
    guard++;
  }
  return out;
};

// Σ(plannedHours по месяцам). Игнорит null/нечисло (пустой инпут — 0). Округление
// до 2 знаков (как parseEffort), чтобы 0.1+0.2 не давало хвост в сверке.
export const sumSlotHours = (slots: Array<{ plannedHours: number | null }>): number => {
  let sum = 0;
  for (const s of slots) {
    if (s.plannedHours != null && Number.isFinite(s.plannedHours)) sum += s.plannedHours;
  }
  return Math.round(sum * 100) / 100;
};

// Σ-сверка ручного раскида с объёмом проекта. Допуск 1 ч (как EVEN sigmaOk).
// target null (объём не задан) → не «ок» (нечего сверять). { sum, target, ok }.
export const reconcileSlots = (
  slots: Array<{ plannedHours: number | null }>,
  target: number | null,
): { sum: number; target: number; ok: boolean } => {
  const sum = sumSlotHours(slots);
  const tgt = target != null ? target : 0;
  const ok = target != null && Math.abs(sum - tgt) <= 1;
  return { sum, target: tgt, ok };
};

// W3B.16: утилизация периода = план / СВОБОДНАЯ ёмкость (PreviewRow.capacity).
// Это доля свободной ёмкости, которую съедает план периода — иной показатель, чем
// hours/maxHours (масштаб бара). null = нет ёмкости (capacity null или ≤ 0) →
// бар-утилизации не рисуем. > 1 = овербукинг (совпадает с row.over). Не округляем
// — округление в UI (formatPct из cap-tokens).
export const utilPct = (row: Pick<PreviewRow, 'hours' | 'capacity'>): number | null => {
  if (row.capacity == null || row.capacity <= 0) return null;
  return row.hours / row.capacity;
};
