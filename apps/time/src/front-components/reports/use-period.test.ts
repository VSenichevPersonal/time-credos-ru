import { describe, expect, it } from 'vitest';

import { calcPeriodRange } from './use-period';

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('calcPeriodRange — month', () => {
  it('текущий месяц (offset=0)', () => {
    const r = calcPeriodRange('month', 0, d('2026-06-15'));
    expect(r.from).toBe('2026-06-01T00:00:00.000Z');
    expect(r.to).toBe('2026-06-30T23:59:59.999Z');
    expect(r.label).toBe('июнь 2026');
    expect(r.gran).toBe('month');
  });

  it('предыдущий месяц (offset=-1)', () => {
    const r = calcPeriodRange('month', -1, d('2026-06-15'));
    expect(r.from).toBe('2026-05-01T00:00:00.000Z');
    expect(r.to).toBe('2026-05-31T23:59:59.999Z');
    expect(r.label).toBe('май 2026');
  });

  it('переход через год (январь -1 → декабрь прошлого года)', () => {
    const r = calcPeriodRange('month', -1, d('2026-01-10'));
    expect(r.from).toBe('2025-12-01T00:00:00.000Z');
    expect(r.to).toBe('2025-12-31T23:59:59.999Z');
    expect(r.label).toBe('декабрь 2025');
  });

  it('февраль 2024 (високосный) — 29 дней', () => {
    const r = calcPeriodRange('month', 0, d('2024-02-15'));
    expect(r.to).toBe('2024-02-29T23:59:59.999Z');
  });

  it('февраль 2026 (не високосный) — 28 дней', () => {
    const r = calcPeriodRange('month', 0, d('2026-02-15'));
    expect(r.to).toBe('2026-02-28T23:59:59.999Z');
  });
});

describe('calcPeriodRange — quarter', () => {
  it('Q1 (offset=0, март)', () => {
    const r = calcPeriodRange('quarter', 0, d('2026-03-01'));
    expect(r.from).toBe('2026-01-01T00:00:00.000Z');
    expect(r.to).toBe('2026-03-31T23:59:59.999Z');
    expect(r.label).toBe('2026 · 1 кв.');
  });

  it('Q2 (offset=0, апрель)', () => {
    const r = calcPeriodRange('quarter', 0, d('2026-06-15'));
    expect(r.from).toBe('2026-04-01T00:00:00.000Z');
    expect(r.to).toBe('2026-06-30T23:59:59.999Z');
    expect(r.label).toBe('2026 · 2 кв.');
  });

  it('предыдущий квартал (offset=-1)', () => {
    const r = calcPeriodRange('quarter', -1, d('2026-06-15'));
    expect(r.from).toBe('2026-01-01T00:00:00.000Z');
    expect(r.to).toBe('2026-03-31T23:59:59.999Z');
  });

  it('Q4 (offset=0, декабрь)', () => {
    const r = calcPeriodRange('quarter', 0, d('2026-12-15'));
    expect(r.from).toBe('2026-10-01T00:00:00.000Z');
    expect(r.to).toBe('2026-12-31T23:59:59.999Z');
    expect(r.label).toBe('2026 · 4 кв.');
  });
});

describe('calcPeriodRange — year', () => {
  it('текущий год (offset=0)', () => {
    const r = calcPeriodRange('year', 0, d('2026-06-15'));
    expect(r.from).toBe('2026-01-01T00:00:00.000Z');
    expect(r.to).toBe('2026-12-31T23:59:59.999Z');
    expect(r.label).toBe('2026 год');
  });

  it('предыдущий год (offset=-1)', () => {
    const r = calcPeriodRange('year', -1, d('2026-06-15'));
    expect(r.from).toBe('2025-01-01T00:00:00.000Z');
    expect(r.to).toBe('2025-12-31T23:59:59.999Z');
    expect(r.label).toBe('2025 год');
  });
});
