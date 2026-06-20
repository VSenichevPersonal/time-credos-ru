import { ENTRY_STATUS, type EntryStatusCode } from 'src/constants/approval';
import { mondayOf, toIso } from 'src/front-components/grid/use-week';
import type { ApiEntry } from 'src/front-components/grid/types';

// REQ-0014 «Мои периоды»: группировка записей юзера по неделям (Пн–Вс) с
// агрегатным статусом периода. Чистая логика (unit-тестируемо, без host-DOM).

// Агрегатный статус недели по статусам её записей.
// Правило (от «слабого» к «сильному», как видит исполнитель свой период):
//   REJECTED  — есть хоть одна отклонённая → нужно переделать (приоритет).
//   DRAFT     — есть неотправленные черновики → период не сдан.
//   SUBMITTED — всё отправлено, ждёт согласования.
//   APPROVED  — всё согласовано (период закрыт).
// Пустой набор статусов → DRAFT (записи без статуса считаем черновиком).
export const aggregateStatus = (statuses: ReadonlyArray<string>): EntryStatusCode => {
  const norm = statuses.map((s) => (s ? s.toUpperCase() : ENTRY_STATUS.DRAFT));
  if (norm.length === 0) return ENTRY_STATUS.DRAFT;
  if (norm.some((s) => s === ENTRY_STATUS.REJECTED)) return ENTRY_STATUS.REJECTED;
  if (norm.some((s) => s === ENTRY_STATUS.DRAFT)) return ENTRY_STATUS.DRAFT;
  if (norm.every((s) => s === ENTRY_STATUS.APPROVED)) return ENTRY_STATUS.APPROVED;
  return ENTRY_STATUS.SUBMITTED;
};

export type WeekSummary = {
  weekStart: string; // ISO дата понедельника (YYYY-MM-DD)
  weekEnd: string; // ISO дата воскресенья (YYYY-MM-DD)
  hours: number; // Σ часов недели (2 знака)
  count: number; // число записей
  status: EntryStatusCode; // агрегатный статус
};

// Понедельник недели записи по её полю date (берём дату-часть, UTC).
const weekStartOf = (entryDate: string): string => {
  const d = new Date(entryDate);
  return toIso(mondayOf(d));
};

const addDaysIso = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// Записи → недели (по убыванию даты: свежие сверху). После отправки период не
// «исчезает» — он остаётся в списке со статусом SUBMITTED.
export const summarizeWeeks = (entries: ReadonlyArray<ApiEntry>): WeekSummary[] => {
  const byWeek = new Map<string, { hours: number; count: number; statuses: string[] }>();
  for (const e of entries) {
    if (!e.date) continue;
    const ws = weekStartOf(e.date);
    const bucket = byWeek.get(ws) ?? { hours: 0, count: 0, statuses: [] };
    bucket.hours += typeof e.hours === 'number' ? e.hours : 0;
    bucket.count += 1;
    bucket.statuses.push(e.status ?? ENTRY_STATUS.DRAFT);
    byWeek.set(ws, bucket);
  }
  return [...byWeek.entries()]
    .map(([weekStart, b]) => ({
      weekStart,
      weekEnd: addDaysIso(weekStart, 6),
      hours: round2(b.hours),
      count: b.count,
      status: aggregateStatus(b.statuses),
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
};
