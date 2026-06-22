/**
 * Чистый расчёт «Проекты — бюджет/распланировано/факт» (в ЧАСАХ) — B1 +
 * REPORTS_COMPLETENESS P1.
 *
 * ТРИ РАЗНЫЕ величины на проект [[planning-identity-decisions]]:
 *   · БЮДЖЕТ (planned)        = project.plannedEffort (оценка-бюджет, НЕИЗМЕНЕН).
 *   · РАСПЛАНИРОВАНО (allocated) = Σ plannedHours plan-slots проекта за период.
 *   · ФАКТ (fact)             = Σ часов записей проекта за период.
 * Производные по ДВУМ осям (не путать, B1):
 *   · ОСВОЕНИЕ: remaining=бюджет−факт, pct=факт/бюджет, overrun=факт>бюджет.
 *   · РАСПРЕДЕЛЕНИЕ: unallocated=бюджет−распланировано, allocatedPct=распл/бюджет,
 *     overbooked=распланировано>бюджет (переаллокация = warning, не блок).
 *
 * Аналог Timetta «Список проектов в работе» для РП. БЕЗ денег/billable —
 * [[no-billable-concept]]: только часы. Чтение слотов — SSOT shared/plan-slots-read.
 *
 * Факт считается из записей credosTimeEntry (а НЕ из хранимого factHours), чтобы
 * работал опц. период-фильтр: с границами factHours (накопительный за всё время)
 * был бы неверен. Без периода результат совпадает с factHours (Σ всех записей).
 *
 * Логика без сети → тестируется без живого REST (как reports-calc / project-team).
 * Контракт /s/reports?groupBy=projects-plan-fact — в reports.logic.ts.
 * Проекты — НЕ ПДн, redaction не нужен.
 */

import type { RawEntry } from './reports-calc';
import { allocatedByProject, type RawPlanSlot } from './shared/plan-slots-read';

export type { RawEntry, RawPlanSlot };

// Проект с полями плана/факта/статуса/срока (срез credosTimeProject для отчёта).
// factHours/budgetRemaining хранимые — НЕ используем для расчёта (период-фильтр),
// но status/code/даты берём как есть.
export type RawProjectPlan = {
  id: string;
  name: string | null;
  code: string | null;
  status: string | null;
  plannedEffort: number | null; // плановые часы
  startDate?: string | null;
  endDate?: string | null;
};

// Строка отчёта по проекту: ТРИ величины (бюджет/распланировано/факт) + производные.
// [[planning-identity-decisions]]: planned=БЮДЖЕТ (plannedEffort, неизменен),
// allocated=РАСПЛАНИРОВАНО (Σ слотов), fact=ФАКТ. budgetRemaining (план−факт) и
// pct (освоение=факт/план) — про ОСВОЕНИЕ; unallocated (план−распланировано) и
// overbooked — про РАСПРЕДЕЛЕНИЕ. Не путать две оси (B1, PLAN_VS_BUDGET_COVERAGE §1.2).
export type ProjectPlanFactRow = {
  projectId: string;
  name: string; // имя проекта (fallback code/id) — НЕ ПДн
  code: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  planned: number | null; // БЮДЖЕТ = plannedEffort, null если не задан
  allocated: number; // РАСПЛАНИРОВАНО = Σ plannedHours слотов проекта за период
  fact: number; // ФАКТ = Σ часов записей проекта за период
  remaining: number | null; // остаток ОСВОЕНИЯ = бюджет − факт; null если бюджета нет
  unallocated: number | null; // остаток РАСПРЕДЕЛЕНИЯ = бюджет − распланировано; null если бюджета нет
  overrun: boolean; // факт > бюджет → перерасход освоения (флаг подсветки UI)
  overbooked: boolean; // распланировано > бюджет → переаллокация (warning, не блок)
  pct: number | null; // освоение = факт / бюджет (0..1+); null если бюджета нет/0
  allocatedPct: number | null; // покрытие = распланировано / бюджет (0..1+); null если бюджета нет/0
};

export type ProjectsPlanFactInput = {
  projects: RawProjectPlan[];
  entries: RawEntry[];
  slots?: RawPlanSlot[]; // plan-slots для «распланировано» (Σ). Не передано → allocated=0.
};

export type ProjectsPlanFactTotals = {
  planned: number; // Σ БЮДЖЕТОВ (проекты без бюджета не вносят вклад)
  allocated: number; // Σ РАСПЛАНИРОВАНО (Σ слотов всех проектов за период)
  fact: number; // Σ ФАКТА
  remaining: number; // Σ бюджет − Σ факт (по проектам с бюджетом) — освоение
  unallocated: number; // Σ бюджет − Σ распланировано (по проектам с бюджетом) — распределение
  overrunCount: number; // сколько проектов в перерасходе (факт > бюджет)
  overbookedCount: number; // сколько проектов в переаллокации (распланировано > бюджет)
};

export type ProjectsPlanFactResult = {
  ok: true;
  period: { from: string | null; to: string | null };
  totals: ProjectsPlanFactTotals;
  count: number;
  rows: ProjectPlanFactRow[];
};

const dayKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

// Запись в периоде [from, to] по дню (включительно). Пустые границы → без среза.
// Запись без даты учитывается только если обе границы пусты (нечего сравнить).
const inPeriod = (
  entryDate: string | null | undefined,
  from: string | null,
  to: string | null,
): boolean => {
  if (!from && !to) return true;
  const d = dayKey(entryDate);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

const round2 = (n: number): number => Number(n.toFixed(2));
const round4 = (n: number): number => Number(n.toFixed(4));

export type ProjectsPlanFactOptions = {
  from?: string | null;
  to?: string | null;
  departmentId?: string | null; // фильтр по отделу проекта (опц.)
  status?: string | null; // фильтр по статусу проекта (опц., UPPER_CASE SELECT)
};

/**
 * План/факт/остаток по проектам.
 *
 * Шаги:
 *  1. Факт по проектам = Σ часов записей (период-фильтр по дню записи).
 *     Распланировано = Σ слотов проекта (период-фильтр по месяцу слота).
 *  2. По каждому проекту: planned=бюджет, allocated=распланировано, fact;
 *     remaining=бюджет−факт, unallocated=бюджет−распланировано, overrun=факт>бюджет,
 *     overbooked=распланировано>бюджет, pct=факт/бюджет, allocatedPct=распл/бюджет.
 *  3. Сортировка: сначала перерасход (overrun), затем по факту убыв.,
 *     чтобы РП видел проблемные проекты сверху.
 *
 * Фильтры departmentId/status — опц., сравниваются в памяти (инъекции нет).
 * Записи без часов/без projectId не учитываются. Проект без записей → fact=0.
 */
export const computeProjectsPlanFact = (
  input: ProjectsPlanFactInput,
  options: ProjectsPlanFactOptions = {},
): ProjectsPlanFactResult => {
  const from = options.from ?? null;
  const to = options.to ?? null;
  const statusFilter = options.status ?? null;
  const deptFilter = options.departmentId ?? null;

  // Факт по проектам из записей (период-фильтр).
  const factByProject = new Map<string, number>();
  for (const e of input.entries) {
    const hours = e.hours ?? 0;
    if (hours === 0 || !e.projectId) continue;
    if (!inPeriod(e.date, from, to)) continue;
    factByProject.set(e.projectId, (factByProject.get(e.projectId) ?? 0) + hours);
  }

  // Распланировано по проектам = Σ plannedHours слотов (период-фильтр по месяцу).
  // SSOT чтения слотов — shared/plan-slots-read (один контракт для всех отчётов).
  const allocByProject = allocatedByProject(input.slots ?? [], { from, to });

  // Отдел проекта для опц. фильтра — поле departmentId на RawProjectPlan нет, но
  // фильтр departmentId применяем через расширенный тип (если поле присутствует).
  const projectDept = (p: RawProjectPlan): string | null =>
    (p as RawProjectPlan & { departmentId?: string | null }).departmentId ?? null;

  const rows: ProjectPlanFactRow[] = input.projects
    .filter((p) => (statusFilter ? p.status === statusFilter : true))
    .filter((p) => (deptFilter ? projectDept(p) === deptFilter : true))
    .map((p) => {
      const planned = p.plannedEffort;
      const fact = round2(factByProject.get(p.id) ?? 0);
      const allocated = round2(allocByProject.get(p.id) ?? 0);
      const hasPlan = planned != null;
      // Ось ОСВОЕНИЯ (бюджет vs факт).
      const remaining = hasPlan ? round2(planned - fact) : null;
      const overrun = hasPlan ? fact > planned : false;
      const pct = hasPlan && planned > 0 ? round4(fact / planned) : null;
      // Ось РАСПРЕДЕЛЕНИЯ (бюджет vs распланировано).
      const unallocated = hasPlan ? round2(planned - allocated) : null;
      const overbooked = hasPlan ? allocated > planned : false;
      const allocatedPct = hasPlan && planned > 0 ? round4(allocated / planned) : null;
      return {
        projectId: p.id,
        name: p.name ?? p.code ?? p.id,
        code: p.code ?? null,
        status: p.status ?? null,
        startDate: p.startDate ?? null,
        endDate: p.endDate ?? null,
        planned: hasPlan ? round2(planned) : null,
        allocated,
        fact,
        remaining,
        unallocated,
        overrun,
        overbooked,
        pct,
        allocatedPct,
      };
    })
    .sort(
      (a, b) =>
        // Перерасход — наверх (требует внимания РП).
        Number(b.overrun) - Number(a.overrun) ||
        // Затем по факту убыв. (крупные проекты первыми).
        b.fact - a.fact ||
        a.name.localeCompare(b.name),
    );

  const totals = rows.reduce<ProjectsPlanFactTotals>(
    (acc, r) => {
      acc.fact += r.fact;
      acc.allocated += r.allocated;
      if (r.planned != null) {
        acc.planned += r.planned;
        acc.remaining += r.remaining ?? 0;
        acc.unallocated += r.unallocated ?? 0;
      }
      if (r.overrun) acc.overrunCount += 1;
      if (r.overbooked) acc.overbookedCount += 1;
      return acc;
    },
    {
      planned: 0,
      allocated: 0,
      fact: 0,
      remaining: 0,
      unallocated: 0,
      overrunCount: 0,
      overbookedCount: 0,
    },
  );

  return {
    ok: true,
    period: { from, to },
    totals: {
      planned: round2(totals.planned),
      allocated: round2(totals.allocated),
      fact: round2(totals.fact),
      remaining: round2(totals.remaining),
      unallocated: round2(totals.unallocated),
      overrunCount: totals.overrunCount,
      overbookedCount: totals.overbookedCount,
    },
    count: rows.length,
    rows,
  };
};
