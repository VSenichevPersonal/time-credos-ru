import { describe, expect, it } from 'vitest';

import {
  computeMissingTimesheets,
  weekBounds,
  type MissingInput,
} from './missing-timesheets';

// Неделя 2026-06-15 (пн) .. 2026-06-21 (вс). 5 рабочих дней × 8ч = 40ч норма.
const WEEK = { from: '2026-06-15', to: '2026-06-21' };

const workdayCalendar = () =>
  ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19'].map((date) => ({
    date,
    dayType: 'WORKDAY',
    hours: 8,
  }));

const emp = (id: string, departmentId: string | null = 'd1') => ({
  id,
  firstName: 'Имя',
  lastName: `Фам-${id}`,
  departmentId,
});

const dept = (capacityFactor: number | null = 1) => ({
  id: 'd1',
  code: 'OPIB',
  capacityFactor,
});

const entry = (employeeId: string, date: string, hours: number) => ({
  id: `${employeeId}-${date}`,
  date,
  hours,
  employeeId,
  projectId: 'p1',
});

const input = (over: Partial<MissingInput> = {}): MissingInput => ({
  entries: [],
  employees: [],
  departments: [dept()],
  calendar: workdayCalendar(),
  absences: [],
  ...over,
});

describe('weekBounds', () => {
  it('MONDAY: понедельник-старт для среды 2026-06-17', () => {
    expect(weekBounds(new Date('2026-06-17T12:00:00Z'), 'MONDAY')).toEqual({
      from: '2026-06-15',
      to: '2026-06-21',
    });
  });

  it('MONDAY: воскресенье 2026-06-21 относится к недели 15..21', () => {
    expect(weekBounds(new Date('2026-06-21T23:00:00Z'), 'MONDAY')).toEqual({
      from: '2026-06-15',
      to: '2026-06-21',
    });
  });

  it('SUNDAY: воскресенье-старт для среды 2026-06-17', () => {
    expect(weekBounds(new Date('2026-06-17T12:00:00Z'), 'SUNDAY')).toEqual({
      from: '2026-06-14',
      to: '2026-06-20',
    });
  });

  it('MONDAY: понедельник 2026-06-15 — начало своей недели', () => {
    expect(weekBounds(new Date('2026-06-15T00:00:00Z'), 'MONDAY').from).toBe('2026-06-15');
  });
});

describe('computeMissingTimesheets', () => {
  it('сотрудник без записей попадает в список (недобор = вся норма)', () => {
    const r = computeMissingTimesheets(input({ employees: [emp('e1')] }), WEEK);
    expect(r.total).toBe(1);
    expect(r.rows[0]).toMatchObject({ employeeId: 'e1', norm: 40, fact: 0, under: 40 });
  });

  it('полностью заполнивший норму НЕ попадает', () => {
    const entries = [
      entry('e1', '2026-06-15', 8),
      entry('e1', '2026-06-16', 8),
      entry('e1', '2026-06-17', 8),
      entry('e1', '2026-06-18', 8),
      entry('e1', '2026-06-19', 8),
    ];
    const r = computeMissingTimesheets(input({ employees: [emp('e1')], entries }), WEEK);
    expect(r.total).toBe(0);
  });

  it('частично заполнивший попадает с корректным недобором', () => {
    const entries = [entry('e1', '2026-06-15', 8), entry('e1', '2026-06-16', 8)];
    const r = computeMissingTimesheets(input({ employees: [emp('e1')], entries }), WEEK);
    expect(r.rows[0]).toMatchObject({ fact: 16, under: 24 });
  });

  it('threshold=0.1 прощает 10% недобор (36 из 40 — ок)', () => {
    const entries = [
      entry('e1', '2026-06-15', 8),
      entry('e1', '2026-06-16', 8),
      entry('e1', '2026-06-17', 8),
      entry('e1', '2026-06-18', 8),
      entry('e1', '2026-06-19', 4),
    ]; // факт 36, норма 40
    const strict = computeMissingTimesheets(input({ employees: [emp('e1')], entries }), WEEK);
    expect(strict.total).toBe(1); // строго — недобор есть
    const lax = computeMissingTimesheets(
      input({ employees: [emp('e1')], entries }),
      WEEK,
      { fillThreshold: 0.1 },
    );
    expect(lax.total).toBe(0); // 36 >= 40*0.9=36
  });

  it('capacityFactor отдела уменьшает личную норму', () => {
    const r = computeMissingTimesheets(
      input({ employees: [emp('e1')], departments: [dept(0.5)] }),
      WEEK,
    );
    expect(r.rows[0].norm).toBe(20); // 40 × 0.5
  });

  it('отсутствие вычитает рабочие часы из нормы', () => {
    // отпуск всю неделю → норма 0 → не напоминаем
    const r = computeMissingTimesheets(
      input({
        employees: [emp('e1')],
        absences: [{ employeeId: 'e1', startDate: '2026-06-15', endDate: '2026-06-21' }],
      }),
      WEEK,
    );
    expect(r.total).toBe(0);
  });

  it('частичное отсутствие (2 дня) уменьшает норму на эти дни', () => {
    const r = computeMissingTimesheets(
      input({
        employees: [emp('e1')],
        absences: [{ employeeId: 'e1', startDate: '2026-06-15', endDate: '2026-06-16' }],
      }),
      WEEK,
    );
    expect(r.rows[0].norm).toBe(24); // 40 − 16
  });

  it('CISO-007: ФИО скрыто по умолчанию → стабильный КОД (не пусто/UUID), раскрывается при revealNames', () => {
    const hidden = computeMissingTimesheets(input({ employees: [emp('e1')] }), WEEK);
    // reveal=false: имя НЕ ФИО, НЕ пусто, НЕ сырой UUID — стабильный КОД сотрудника.
    expect(hidden.rows[0].name).not.toBe('');
    expect(hidden.rows[0].name).not.toBe('e1');
    expect(hidden.rows[0].name).not.toBe('Фам-e1 Имя');
    expect(hidden.rows[0].name).toMatch(/^Сотрудник·/);
    const shown = computeMissingTimesheets(input({ employees: [emp('e1')] }), WEEK, {
      revealNames: true,
    });
    expect(shown.rows[0].name).toBe('Фам-e1 Имя');
  });

  it('сортировка по убыванию недобора', () => {
    const entries = [entry('e2', '2026-06-15', 8)]; // e2 недобор 32, e1 недобор 40
    const r = computeMissingTimesheets(
      input({ employees: [emp('e1'), emp('e2')], entries }),
      WEEK,
    );
    expect(r.rows.map((x) => x.employeeId)).toEqual(['e1', 'e2']);
  });

  it('записи вне недели игнорируются', () => {
    const entries = [entry('e1', '2026-06-08', 40)]; // прошлая неделя
    const r = computeMissingTimesheets(input({ employees: [emp('e1')], entries }), WEEK);
    expect(r.rows[0].fact).toBe(0);
  });

  it('сотрудник без отдела: capacityFactor=1 (полная норма)', () => {
    const r = computeMissingTimesheets(
      input({ employees: [emp('e1', null)], departments: [] }),
      WEEK,
    );
    expect(r.rows[0].norm).toBe(40);
  });

  it('пустой ввод → пустой результат', () => {
    const r = computeMissingTimesheets(input(), WEEK);
    expect(r).toMatchObject({ total: 0, rows: [], threshold: 0 });
  });
});
