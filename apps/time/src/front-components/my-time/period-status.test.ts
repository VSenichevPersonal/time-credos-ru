import { describe, expect, it } from 'vitest';

import { ENTRY_STATUS } from 'src/constants/approval';
import type { ApiEntry } from 'src/front-components/grid/types';
import { aggregateStatus, summarizeWeeks } from './period-status';

const entry = (date: string, hours: number, status?: string): ApiEntry => ({
  id: `${date}-${Math.random()}`,
  date,
  hours,
  description: null,
  status: status ?? null,
  projectId: 'p1',
  workTypeId: 'w1',
  employeeId: 'e1',
});

describe('aggregateStatus', () => {
  it('пустой набор → DRAFT', () => {
    expect(aggregateStatus([])).toBe(ENTRY_STATUS.DRAFT);
  });

  it('всё согласовано → APPROVED', () => {
    expect(aggregateStatus(['APPROVED', 'APPROVED'])).toBe(ENTRY_STATUS.APPROVED);
  });

  it('всё отправлено → SUBMITTED', () => {
    expect(aggregateStatus(['SUBMITTED', 'SUBMITTED'])).toBe(ENTRY_STATUS.SUBMITTED);
  });

  it('есть черновик при отправленных → DRAFT (период не сдан)', () => {
    expect(aggregateStatus(['SUBMITTED', 'DRAFT'])).toBe(ENTRY_STATUS.DRAFT);
  });

  it('отклонённая перекрывает остальное → REJECTED', () => {
    expect(aggregateStatus(['APPROVED', 'REJECTED', 'DRAFT'])).toBe(ENTRY_STATUS.REJECTED);
  });

  it('lowercase-статусы нормализуются', () => {
    expect(aggregateStatus(['approved', 'approved'])).toBe(ENTRY_STATUS.APPROVED);
  });
});

describe('summarizeWeeks', () => {
  it('пустой ввод → пустой массив', () => {
    expect(summarizeWeeks([])).toEqual([]);
  });

  it('группирует по неделям Пн–Вс и суммирует часы', () => {
    // 2026-06-15 — понедельник; 2026-06-21 — воскресенье той же недели.
    const weeks = summarizeWeeks([
      entry('2026-06-15T10:00:00.000Z', 8, 'APPROVED'),
      entry('2026-06-21T10:00:00.000Z', 4, 'APPROVED'),
    ]);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].weekStart).toBe('2026-06-15');
    expect(weeks[0].weekEnd).toBe('2026-06-21');
    expect(weeks[0].hours).toBe(12);
    expect(weeks[0].count).toBe(2);
    expect(weeks[0].status).toBe(ENTRY_STATUS.APPROVED);
  });

  it('разные недели сортируются по убыванию даты (свежие сверху)', () => {
    const weeks = summarizeWeeks([
      entry('2026-06-01T10:00:00.000Z', 8),
      entry('2026-06-15T10:00:00.000Z', 8),
    ]);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].weekStart > weeks[1].weekStart).toBe(true);
  });

  it('воскресенье предыдущей недели не сливается с понедельником следующей', () => {
    // 2026-06-14 — воскресенье; 2026-06-15 — понедельник.
    const weeks = summarizeWeeks([
      entry('2026-06-14T10:00:00.000Z', 8),
      entry('2026-06-15T10:00:00.000Z', 8),
    ]);
    expect(weeks).toHaveLength(2);
  });

  it('округляет часы до 2 знаков', () => {
    const weeks = summarizeWeeks([
      entry('2026-06-15T10:00:00.000Z', 0.1),
      entry('2026-06-16T10:00:00.000Z', 0.2),
    ]);
    expect(weeks[0].hours).toBe(0.3); // 0.1 + 0.2 = 0.30000000000000004 → round2
  });
});
