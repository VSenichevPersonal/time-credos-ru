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

  it('UC-APR-05: rejectComment из первой REJECTED-записи (не null)', () => {
    const e = (date: string, status: string, rejectComment?: string): ApiEntry => ({
      id: `${date}-rc`,
      date,
      hours: 8,
      description: null,
      status,
      projectId: 'p1',
      workTypeId: 'w1',
      employeeId: 'e1',
      rejectComment: rejectComment ?? null,
    });
    const weeks = summarizeWeeks([
      e('2026-06-15T10:00:00.000Z', 'REJECTED', 'Часы завышены'),
      e('2026-06-16T10:00:00.000Z', 'REJECTED', 'Второй комментарий'),
    ]);
    expect(weeks[0].rejectComment).toBe('Часы завышены');
    expect(weeks[0].status).toBe(ENTRY_STATUS.REJECTED);
  });

  it('UC-APR-05: rejectComment = null если нет REJECTED-записей', () => {
    const weeks = summarizeWeeks([
      entry('2026-06-15T10:00:00.000Z', 8, 'APPROVED'),
    ]);
    expect(weeks[0].rejectComment).toBeNull();
  });

  it('UC-APR-05: REJECTED-запись без rejectComment текста — не попадает в список', () => {
    const e = (date: string, status: string, rejectComment?: string): ApiEntry => ({
      id: `${date}-rc2`,
      date,
      hours: 8,
      description: null,
      status,
      projectId: 'p1',
      workTypeId: 'w1',
      employeeId: 'e1',
      rejectComment: rejectComment ?? null,
    });
    const weeks = summarizeWeeks([
      e('2026-06-15T10:00:00.000Z', 'REJECTED'), // без текста
    ]);
    expect(weeks[0].rejectComment).toBeNull();
  });

  // ─── WI-56 аудит: кто отклонил / кто отозвал ────────────────────────────────
  const audited = (
    date: string,
    status: string,
    audit: { resolvedBy?: string | null; revokedBy?: string | null },
  ): ApiEntry => ({
    id: `${date}-au`,
    date,
    hours: 8,
    description: null,
    status,
    projectId: 'p1',
    workTypeId: 'w1',
    employeeId: 'e1',
    ...audit,
  });

  it('WI-56: resolvedBy REJECTED-записи попадает в неделю', () => {
    const weeks = summarizeWeeks([
      audited('2026-06-15T10:00:00.000Z', 'REJECTED', { resolvedBy: 'uw-mgr' }),
    ]);
    expect(weeks[0].resolvedBy).toBe('uw-mgr');
    expect(weeks[0].revokedBy).toBeNull();
  });

  it('WI-56: revokedBy с SUBMITTED-записи (отзыв согласования) попадает в неделю', () => {
    const weeks = summarizeWeeks([
      audited('2026-06-15T10:00:00.000Z', 'SUBMITTED', { revokedBy: 'uw-rev' }),
    ]);
    expect(weeks[0].revokedBy).toBe('uw-rev');
    expect(weeks[0].resolvedBy).toBeNull();
  });

  it('WI-56: resolvedBy берётся ТОЛЬКО с REJECTED (не с APPROVED)', () => {
    const weeks = summarizeWeeks([
      audited('2026-06-15T10:00:00.000Z', 'APPROVED', { resolvedBy: 'uw-appr' }),
    ]);
    expect(weeks[0].resolvedBy).toBeNull();
  });

  it('WI-56: без аудита поля null (обратная совместимость)', () => {
    const weeks = summarizeWeeks([entry('2026-06-15T10:00:00.000Z', 8, 'APPROVED')]);
    expect(weeks[0].resolvedBy).toBeNull();
    expect(weeks[0].revokedBy).toBeNull();
  });
});
