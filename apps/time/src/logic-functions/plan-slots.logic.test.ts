import { describe, expect, it } from 'vitest';

import { parseInputSlots } from './plan-slots.logic';

// B3-гард мусорных слотов: parseInputSlots — единственный фильтр входа upsert.
// periodMonth строго 'YYYY-MM'; plannedHours обязателен и конечен. Слоты, не
// проходящие гард, ОТБРАСЫВАЮТСЯ молча (не блокируют валидные в той же пачке).

const DEPT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EMP = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('parseInputSlots — B3-гард мусорных слотов', () => {
  it('валидный слот проходит', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 40 }]);
    expect(out).toEqual([
      { periodMonth: '2026-06', plannedHours: 40, departmentId: null, employeeId: null },
    ]);
  });

  it('пустой periodMonth → слот отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '', plannedHours: 40 }])).toEqual([]);
  });

  it('отсутствует periodMonth → слот отброшен', () => {
    expect(parseInputSlots([{ plannedHours: 40 }])).toEqual([]);
  });

  it('невалидный формат месяца (не YYYY-MM) → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026/06', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-6', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: 'июнь', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-06-01', plannedHours: 40 }])).toEqual([]);
  });

  it('plannedHours null → слот отброшен (B3, не коэрсится в 0/удаление)', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: null }])).toEqual([]);
  });

  it('plannedHours отсутствует → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06' }])).toEqual([]);
  });

  it('plannedHours пустая строка → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: '' }])).toEqual([]);
  });

  it('plannedHours NaN/нечисло → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: 'abc' }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: Number.NaN }])).toEqual([]);
  });

  it('plannedHours=0 — ВАЛИДНЫЙ вход (семантика «удалить по ключу»), проходит', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 0 }]);
    expect(out).toHaveLength(1);
    expect(out[0].plannedHours).toBe(0);
  });

  it('строковое число часов приводится к number', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: '40' }]);
    expect(out[0].plannedHours).toBe(40);
  });

  it('departmentId/employeeId UUID сохраняются', () => {
    const out = parseInputSlots([
      { periodMonth: '2026-06', plannedHours: 8, departmentId: DEPT, employeeId: EMP },
    ]);
    expect(out[0].departmentId).toBe(DEPT);
    expect(out[0].employeeId).toBe(EMP);
  });

  it('departmentId/employeeId пусто → null', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 8 }]);
    expect(out[0].departmentId).toBeNull();
    expect(out[0].employeeId).toBeNull();
  });

  // validUuidParam БРОСАЕТ на невалидном UUID (CISO-006 защита от инъекции) —
  // handler ловит в try/catch и отдаёт ok:false. Не молчаливый null.
  it('мусорный departmentId (не UUID) → бросает (handler вернёт ok:false)', () => {
    expect(() =>
      parseInputSlots([{ periodMonth: '2026-06', plannedHours: 8, departmentId: 'not-a-uuid' }]),
    ).toThrow();
  });

  it('мусорный слот не блокирует валидный в той же пачке', () => {
    const out = parseInputSlots([
      { periodMonth: '', plannedHours: 40 }, // отброшен
      { periodMonth: '2026-07', plannedHours: 20 }, // проходит
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].periodMonth).toBe('2026-07');
  });

  it('дубли по ключу схлопываются (последний выигрывает)', () => {
    const out = parseInputSlots([
      { periodMonth: '2026-06', plannedHours: 10 },
      { periodMonth: '2026-06', plannedHours: 30 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].plannedHours).toBe(30);
  });

  it('JSON-строка (queryString-режим) парсится', () => {
    const out = parseInputSlots(JSON.stringify([{ periodMonth: '2026-06', plannedHours: 8 }]));
    expect(out).toHaveLength(1);
  });

  it('битый JSON / не-массив → пусто', () => {
    expect(parseInputSlots('{not json')).toEqual([]);
    expect(parseInputSlots({ periodMonth: '2026-06' })).toEqual([]);
    expect(parseInputSlots(null)).toEqual([]);
  });
});
