import { describe, expect, it } from 'vitest';

import { scopeKpiTotals } from './kpi-scope';
import type { OlapRow } from './olap-types';

// scopeKpiTotals: KPI-карточки под АКТИВНЫЕ drill-фильтры (не глобал).
// fact/client/util берём из scoped olap totals; норму/недогруз реконструируем
// из строк среза (сумма norm), когда ось несёт норму (dept/employee).

const totals = (over: Partial<Omit<OlapRow, 'drillable'>> = {}): Omit<OlapRow, 'drillable'> => ({
  key: 'total',
  name: 'Итого',
  fact: 0,
  client: 0,
  norm: null,
  util: null,
  under: null,
  byCategory: [],
  ...over,
});

const row = (norm: number | null): Pick<OlapRow, 'norm'> => ({ norm });

describe('scopeKpiTotals (scoped KPI под drill)', () => {
  it('факт/клиент/утил берёт из scoped olap totals (не глобал)', () => {
    // Олап totals = агрегат ОТФИЛЬТРОВАННОГО среза (напр. один отдел), не 1637/5529.
    const out = scopeKpiTotals(totals({ fact: 300, client: 210, util: 0.7 }), []);
    expect(out.fact).toBe(300);
    expect(out.client).toBe(210);
    expect(out.util).toBe(0.7);
  });

  it('норму реконструирует суммой norm строк среза (ось dept/employee)', () => {
    const out = scopeKpiTotals(totals({ fact: 300 }), [row(160), row(160)]);
    expect(out.norm).toBe(320);
    expect(out.under).toBe(20); // norm − fact = 320 − 300
  });

  it('недогруз отрицателен при перегрузе (fact > norm)', () => {
    const out = scopeKpiTotals(totals({ fact: 400 }), [row(320)]);
    expect(out.norm).toBe(320);
    expect(out.under).toBe(-80);
  });

  it('норма=null когда строки без нормы (факт-режущая ось: project/category)', () => {
    const out = scopeKpiTotals(totals({ fact: 500 }), [row(null), row(null)]);
    expect(out.norm).toBeNull();
    expect(out.under).toBeNull();
  });

  it('игнорирует null-нормы при частичном наборе, суммирует только числа', () => {
    const out = scopeKpiTotals(totals({ fact: 100 }), [row(120), row(null)]);
    expect(out.norm).toBe(120);
    expect(out.under).toBe(20);
  });
});
