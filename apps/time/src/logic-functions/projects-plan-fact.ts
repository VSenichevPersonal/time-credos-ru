/**
 * Чистый расчёт «Проекты — план/факт/остаток» (в ЧАСАХ) — REPORTS_COMPLETENESS P1.
 *
 * Аналог Timetta «Список проектов в работе» для РП: по каждому проекту план
 * (plannedEffort), факт (Σ часов записей за период), остаток (план−факт) и флаг
 * перерасхода (факт>план → remaining<0). БЕЗ денег/billable — [[no-billable-concept]]:
 * Timetta показывает план/факт/остаток в деньгах; у нас только часы.
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

export type { RawEntry };

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

// Строка отчёта по проекту: план/факт/остаток (часы) + флаг перерасхода.
export type ProjectPlanFactRow = {
  projectId: string;
  name: string; // имя проекта (fallback code/id) — НЕ ПДн
  code: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  planned: number | null; // плановые часы (plannedEffort), null если не задан
  fact: number; // факт = Σ часов записей проекта за период
  remaining: number | null; // план − факт (часы); null если план не задан
  overrun: boolean; // факт > план → перерасход (флаг подсветки UI)
  pct: number | null; // факт / план (0..1+); null если план не задан/0
};

export type ProjectsPlanFactInput = {
  projects: RawProjectPlan[];
  entries: RawEntry[];
};

export type ProjectsPlanFactTotals = {
  planned: number; // Σ плановых часов (проекты без плана не вносят вклад)
  fact: number; // Σ факта
  remaining: number; // Σ план − Σ факт (по проектам с планом)
  overrunCount: number; // сколько проектов в перерасходе
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
 *  2. По каждому проекту: planned=plannedEffort, fact, remaining=planned−fact,
 *     overrun = fact>planned (только если план задан), pct=fact/planned.
 *  3. Сортировка: сначала перерасход (overrun), затем по |остатку| / факту убыв.,
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
      const hasPlan = planned != null;
      const remaining = hasPlan ? round2(planned - fact) : null;
      const overrun = hasPlan ? fact > planned : false;
      const pct = hasPlan && planned > 0 ? round4(fact / planned) : null;
      return {
        projectId: p.id,
        name: p.name ?? p.code ?? p.id,
        code: p.code ?? null,
        status: p.status ?? null,
        startDate: p.startDate ?? null,
        endDate: p.endDate ?? null,
        planned: hasPlan ? round2(planned) : null,
        fact,
        remaining,
        overrun,
        pct,
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
      if (r.planned != null) {
        acc.planned += r.planned;
        acc.remaining += r.remaining ?? 0;
      }
      if (r.overrun) acc.overrunCount += 1;
      return acc;
    },
    { planned: 0, fact: 0, remaining: 0, overrunCount: 0 },
  );

  return {
    ok: true,
    period: { from, to },
    totals: {
      planned: round2(totals.planned),
      fact: round2(totals.fact),
      remaining: round2(totals.remaining),
      overrunCount: totals.overrunCount,
    },
    count: rows.length,
    rows,
  };
};
