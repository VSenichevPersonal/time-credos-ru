import { describe, expect, it } from 'vitest';

import { calcCopyWithHours } from './use-timesheet-actions';
import type { WeekDay } from './use-week';
import type { ApiEntry } from './types';

// Вспомогательные фабрики

const day = (iso: string, isWeekend = false): WeekDay => ({
  iso,
  dayLabel: iso.slice(8, 10),
  fullLabel: iso,
  dateLabel: iso.slice(8),
  isWeekend,
  isToday: false,
});

// Пн–Пт текущей недели, Сб–Вс выходные
const CUR_WEEK: WeekDay[] = [
  day('2026-06-22'),        // Пн
  day('2026-06-23'),        // Вт
  day('2026-06-24'),        // Ср
  day('2026-06-25'),        // Чт
  day('2026-06-26'),        // Пт
  day('2026-06-27', true),  // Сб
  day('2026-06-28', true),  // Вс
];

const entry = (
  date: string,
  hours: number,
  projectId = 'proj-1',
  workTypeId = 'wt-1',
): ApiEntry => ({
  id: `e-${date}-${projectId}`,
  date,
  hours,
  description: null,
  projectId,
  workTypeId,
});

describe('calcCopyWithHours', () => {
  it('пустые entries → пустой результат', () => {
    const { rowKeys, inputs } = calcCopyWithHours(CUR_WEEK, []);
    expect(rowKeys).toHaveLength(0);
    expect(inputs).toHaveLength(0);
  });

  it('записи прошлой недели → переносятся на тот же день-недели', () => {
    // Пн прошлой недели = 2026-06-15
    const prev = [entry('2026-06-15', 8)]; // Пн → Пн 2026-06-22
    const { rowKeys, inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(rowKeys).toEqual(['proj-1|wt-1']);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].date).toBe('2026-06-22');
    expect(inputs[0].hours).toBe(8);
  });

  it('запись в выходной прошлой недели → НЕ переносится', () => {
    // Сб прошлой недели = 2026-06-20 → maps to day[5] = Сб текущей (isWeekend)
    const prev = [entry('2026-06-20', 4)];
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(inputs).toHaveLength(0);
  });

  it('запись уже заполнена на текущей неделе → не перетирается', () => {
    const prev = [entry('2026-06-15', 8)]; // прошлая Пн
    const cur = [entry('2026-06-22', 6)];  // текущая Пн уже заполнена
    const { inputs } = calcCopyWithHours(CUR_WEEK, [...prev, ...cur]);
    expect(inputs).toHaveLength(0);
  });

  it('несколько проектов из прошлой недели — все переносятся', () => {
    const prev = [
      entry('2026-06-15', 4, 'proj-1', 'wt-1'), // Пн
      entry('2026-06-16', 6, 'proj-2', 'wt-2'), // Вт
    ];
    const { rowKeys, inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(rowKeys).toHaveLength(2);
    expect(inputs.map((i) => i.date)).toEqual(['2026-06-22', '2026-06-23']);
  });

  it('entry.hours=0 или null — пропускается', () => {
    const prev = [entry('2026-06-15', 0)];
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(inputs).toHaveLength(0);
  });

  it('entry без projectId — пропускается', () => {
    const e: ApiEntry = { ...entry('2026-06-15', 8), projectId: null };
    const { inputs } = calcCopyWithHours(CUR_WEEK, [e]);
    expect(inputs).toHaveLength(0);
  });

  it('одна пара проект|вид даёт один rowKey даже если несколько дней', () => {
    const prev = [
      entry('2026-06-15', 4), // Пн
      entry('2026-06-16', 4), // Вт — та же пара
    ];
    const { rowKeys, inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(rowKeys).toHaveLength(1); // один rowKey
    expect(inputs).toHaveLength(2); // два upsert (Пн и Вт)
  });

  it('id в inputs всегда undefined (новые записи, не обновления)', () => {
    const prev = [entry('2026-06-15', 8)];
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(inputs[0].id).toBeUndefined();
  });
});
