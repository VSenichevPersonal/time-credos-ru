import { describe, expect, it } from 'vitest';

// SCOUT-B: тест чистой логики дедупа (planDedup) — группировка по ключу
// (employee, project, workType, день), выбор выжившего, слияние часов.
// Сетевые вызовы НЕ затрагиваются (import — без сайд-эффектов, авто-run gated).
import { keyOf, pickSurvivor, planDedup, round2 } from './dedup-entries.mjs';

const e = (over: Record<string, unknown> = {}) => ({
  id: 'id-' + Math.random().toString(36).slice(2),
  employeeId: 'emp-1',
  projectId: 'proj-1',
  workTypeId: 'wt-1',
  date: '2026-01-08T10:00:00.000Z',
  hours: 8,
  status: 'DRAFT',
  createdAt: '2026-01-08T10:00:00.000Z',
  ...over,
});

describe('dedup keyOf', () => {
  it('одинаковый день/employee/project/workType → один ключ (время суток игнор)', () => {
    const a = keyOf(e({ date: '2026-01-08T09:00:00.000Z' }));
    const b = keyOf(e({ date: '2026-01-08T18:30:00.000Z' }));
    expect(a).toBe(b);
  });
  it('null project/workType дают стабильный ключ', () => {
    expect(keyOf(e({ projectId: null, workTypeId: null }))).toBe('emp-1|-|-|2026-01-08');
  });
});

describe('dedup pickSurvivor', () => {
  it('APPROVED важнее DRAFT', () => {
    const draft = e({ id: 'd', status: 'DRAFT' });
    const appr = e({ id: 'a', status: 'APPROVED' });
    expect(pickSurvivor([draft, appr]).id).toBe('a');
  });
  it('при равном статусе — самая ранняя по createdAt', () => {
    const early = e({ id: 'early', createdAt: '2026-01-08T08:00:00.000Z' });
    const late = e({ id: 'late', createdAt: '2026-01-08T12:00:00.000Z' });
    expect(pickSurvivor([late, early]).id).toBe('early');
  });
});

describe('dedup planDedup', () => {
  it('нет дублей → пустой план', () => {
    const { plan, uniqueKeys } = planDedup([e({ id: '1' }), e({ id: '2', date: '2026-01-09T10:00:00.000Z' })]);
    expect(uniqueKeys).toBe(2);
    expect(plan).toHaveLength(0);
  });

  it('дубль (суммирование по умолчанию) → targetHours = Σ часов, удаляются лишние', () => {
    const { plan } = planDedup([
      e({ id: 'a', hours: 8, status: 'APPROVED' }),
      e({ id: 'b', hours: 4, status: 'DRAFT' }),
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0].survivorId).toBe('a'); // APPROVED выжил
    expect(plan[0].targetHours).toBe(12); // 8 + 4
    expect(plan[0].deleteIds).toEqual(['b']);
  });

  it('keepHours: targetHours = часы выжившего (точная копия, без задвоения)', () => {
    const { plan } = planDedup(
      [
        e({ id: 'a', hours: 8, status: 'APPROVED' }),
        e({ id: 'b', hours: 8, status: 'DRAFT' }),
      ],
      { keepHours: true },
    );
    expect(plan[0].survivorId).toBe('a');
    expect(plan[0].targetHours).toBe(8); // НЕ 16
    expect(plan[0].deleteIds).toEqual(['b']);
  });

  it('три дубля → выживший один, удаляются два, Σ часов', () => {
    const { plan } = planDedup([
      e({ id: 'a', hours: 2 }),
      e({ id: 'b', hours: 3 }),
      e({ id: 'c', hours: 1.5 }),
    ]);
    expect(plan[0].deleteIds).toHaveLength(2);
    expect(plan[0].targetHours).toBe(round2(6.5));
    expect(plan[0].projectIds).toEqual(['proj-1']);
  });

  it('round2 округляет Σ до 2 знаков', () => {
    const { plan } = planDedup([e({ id: 'a', hours: 1.005 }), e({ id: 'b', hours: 2.004 })]);
    expect(plan[0].targetHours).toBe(round2(1.005 + 2.004));
  });
});
