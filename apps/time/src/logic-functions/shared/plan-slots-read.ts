/**
 * SSOT серверного чтения plan-slots для ОТЧЁТОВ (B1).
 *
 * Зачем отдельный модуль: отчёты (reports-calc / projects-plan-fact) живут на
 * бэке (logic-functions, без сети в чистой части) и НЕ могут импортировать
 * front-component calc-load (capacity, React-зона). Чтобы не дублировать формулы
 * «по-разному», вся логика чтения слотов для отчётов собрана здесь — один
 * контракт RawPlanSlot + один набор агрегаторов.
 *
 * Семантика «распланировано» в отчётах = Σ plannedHours слотов проекта (бюджет
 * РАСПРЕДЕЛЁННЫЙ по месяцам/людям). Это НЕ помесячный EVEN-раскид по рабочим дням
 * (тем занимается доска через calc-load.slotsHoursInPeriod) — отчёт оперирует
 * ЦЕЛОСТНЫМИ величинами (бюджет / распланировано / факт), а помесячная разбивка
 * берёт ЦЕЛЫЙ месяц слота, попавший в окно периода (а не долю дня). Так отчёт
 * остаётся простым и детерминированным, без зависимости от производств. календаря.
 *
 * Решение заказчика [[planning-identity-decisions]]: plannedEffort = БЮДЖЕТ
 * (неизменен), распланировано = Σ слотов, факт = factHours — ТРИ разные величины.
 */

// Срез credosTimePlanSlot для отчётов (что отдаёт Core REST). employeeId != null —
// персональный слот (план до сотрудника); null — отдельский/проектный.
export type RawPlanSlot = {
  id?: string;
  projectId: string | null;
  departmentId: string | null;
  employeeId: string | null;
  periodMonth: string | null; // 'YYYY-MM'
  plannedHours: number | null;
};

const MONTH_RE = /^\d{4}-\d{2}$/;

const round2 = (n: number): number => Number(n.toFixed(2));

// Валиден ли слот для учёта: месяц строго 'YYYY-MM', проект задан, часы > 0.
// Пустые/мусорные (B3) и нулевые слоты вклада не дают.
export const isUsableSlot = (s: RawPlanSlot): boolean =>
  !!s.projectId &&
  !!s.periodMonth &&
  MONTH_RE.test(s.periodMonth) &&
  typeof s.plannedHours === 'number' &&
  Number.isFinite(s.plannedHours) &&
  s.plannedHours > 0;

// Месяц слота попадает в окно периода [from, to] (ISO-границы по дню). Учитываем
// слот, если его месяц ПЕРЕСЕКАЕТ окно: месяц 'YYYY-MM' сравниваем с YYYY-MM
// границ. Пустые границы → без среза (учитываются все месяцы). Это «целый месяц»
// семантика (без долей дня) — см. шапку модуля.
export const slotMonthInPeriod = (
  periodMonth: string | null,
  from: string | null,
  to: string | null,
): boolean => {
  if (!periodMonth || !MONTH_RE.test(periodMonth)) return false;
  if (!from && !to) return true;
  const fromM = from ? from.slice(0, 7) : null;
  const toM = to ? to.slice(0, 7) : null;
  if (fromM && periodMonth < fromM) return false;
  if (toM && periodMonth > toM) return false;
  return true;
};

export type SlotFilter = {
  from?: string | null;
  to?: string | null;
};

// Σ распланированных часов по projectId (= «распланировано» проекта). Слоты вне
// периода/невалидные не учитываются. Карта: projectId → Σ plannedHours.
export const allocatedByProject = (
  slots: RawPlanSlot[],
  filter: SlotFilter = {},
): Map<string, number> => {
  const from = filter.from ?? null;
  const to = filter.to ?? null;
  const m = new Map<string, number>();
  for (const s of slots) {
    if (!isUsableSlot(s)) continue;
    if (!slotMonthInPeriod(s.periodMonth, from, to)) continue;
    const pid = s.projectId as string;
    m.set(pid, (m.get(pid) ?? 0) + (s.plannedHours as number));
  }
  for (const [k, v] of m) m.set(k, round2(v));
  return m;
};

// Σ распланированных часов по месяцу (YYYY-MM) — для помесячного «плана из слотов»
// в timeseries. Опц. фильтр отдела (departmentId слота). Карта: 'YYYY-MM' → Σ.
export const allocatedByMonth = (
  slots: RawPlanSlot[],
  opts: SlotFilter & { departmentId?: string | null } = {},
): Map<string, number> => {
  const from = opts.from ?? null;
  const to = opts.to ?? null;
  const dept = opts.departmentId ?? null;
  const m = new Map<string, number>();
  for (const s of slots) {
    if (!isUsableSlot(s)) continue;
    if (dept && s.departmentId !== dept) continue;
    if (!slotMonthInPeriod(s.periodMonth, from, to)) continue;
    const month = s.periodMonth as string;
    m.set(month, (m.get(month) ?? 0) + (s.plannedHours as number));
  }
  for (const [k, v] of m) m.set(k, round2(v));
  return m;
};

// Σ распланированных часов по сотруднику (employeeId != null) — для person-разбивки
// плана в OLAP-оси employee. Слоты без employeeId (отдельские) НЕ учитываются
// (на уровне человека неизвестно, кому достанутся). Карта: employeeId → Σ.
export const allocatedByEmployee = (
  slots: RawPlanSlot[],
  filter: SlotFilter = {},
): Map<string, number> => {
  const from = filter.from ?? null;
  const to = filter.to ?? null;
  const m = new Map<string, number>();
  for (const s of slots) {
    if (!isUsableSlot(s) || !s.employeeId) continue;
    if (!slotMonthInPeriod(s.periodMonth, from, to)) continue;
    const eid = s.employeeId as string;
    m.set(eid, (m.get(eid) ?? 0) + (s.plannedHours as number));
  }
  for (const [k, v] of m) m.set(k, round2(v));
  return m;
};
