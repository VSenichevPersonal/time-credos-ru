import { describe, expect, it } from 'vitest';

import type { ApiEntry, ProjectRef, WorkTypeRef } from './types';
import type { WeekDay } from './use-week';
import type { FilterState } from './use-filters';
import { calcGridModel } from './use-grid-model';

// ─── Фабрики ──────────────────────────────────────────────────────────────

const day = (iso: string): WeekDay => ({
  iso, dayLabel: iso.slice(5), fullLabel: iso, dateLabel: iso.slice(8), isWeekend: false, isToday: false,
});

const DAYS: WeekDay[] = [
  day('2026-06-22'), day('2026-06-23'), day('2026-06-24'),
  day('2026-06-25'), day('2026-06-26'), day('2026-06-27'), day('2026-06-28'),
];

const proj = (id: string, name: string, category: string | null = null): ProjectRef => ({
  id, name, rawName: name, code: null, client: null, departmentId: null, category, approvalRequired: null,
});

const wt = (id: string, name: string): WorkTypeRef => ({
  id, name, group: null, departmentId: null,
});

const entry = (
  projectId: string, workTypeId: string, date: string, hours: number, id = `e-${date}-${projectId}`,
): ApiEntry => ({ id, date, hours, description: null, projectId, workTypeId });

const NO_FILTERS: FilterState = {
  project: new Set(), department: new Set(), workType: new Set(),
  category: new Set(), employee: new Set(), status: new Set(),
};

// ─── Тесты ────────────────────────────────────────────────────────────────

describe('calcGridModel — базовый', () => {
  it('пустые entries → пустые rowList, dayTotals=0, weekTotal=0', () => {
    const { rowList, dayTotals, weekTotal } = calcGridModel([], [], [], DAYS, [], NO_FILTERS);
    expect(rowList).toHaveLength(0);
    expect(dayTotals).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(weekTotal).toBe(0);
  });

  it('одна запись → одна строка, hoursByDay[0]=8', () => {
    const { rowList, dayTotals, weekTotal } = calcGridModel(
      [entry('p1', 'w1', '2026-06-22', 8)],
      [proj('p1', 'Проект А')],
      [wt('w1', 'Разработка')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList).toHaveLength(1);
    expect(rowList[0].hoursByDay[0]).toBe(8);
    expect(rowList[0].rowTotal).toBe(8);
    expect(dayTotals[0]).toBe(8);
    expect(weekTotal).toBe(8);
  });

  it('несколько записей одной строки → суммируются в hoursByDay', () => {
    const { rowList } = calcGridModel(
      [
        entry('p1', 'w1', '2026-06-22', 4),
        entry('p1', 'w1', '2026-06-23', 6),
      ],
      [proj('p1', 'Проект А')],
      [wt('w1', 'Разработка')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].hoursByDay[0]).toBe(4);
    expect(rowList[0].hoursByDay[1]).toBe(6);
    expect(rowList[0].rowTotal).toBe(10);
  });

  it('две пары проект×вид → две строки', () => {
    const { rowList } = calcGridModel(
      [
        entry('p1', 'w1', '2026-06-22', 8),
        entry('p1', 'w2', '2026-06-22', 4),
      ],
      [proj('p1', 'Проект А')],
      [wt('w1', 'Разработка'), wt('w2', 'Тестирование')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList).toHaveLength(2);
  });

  it('запись вне недели → игнорируется', () => {
    const { rowList } = calcGridModel(
      [entry('p1', 'w1', '2026-06-10', 8)], // вне DAYS
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], NO_FILTERS,
    );
    expect(rowList).toHaveLength(0);
  });
});

describe('calcGridModel — dayTotals и weekTotal', () => {
  it('dayTotals — сумма всех строк по столбцу', () => {
    const { dayTotals, weekTotal } = calcGridModel(
      [
        entry('p1', 'w1', '2026-06-22', 8),
        entry('p2', 'w1', '2026-06-22', 4),
        entry('p1', 'w1', '2026-06-23', 6),
      ],
      [proj('p1', 'A'), proj('p2', 'B')],
      [wt('w1', 'R')],
      DAYS, [], NO_FILTERS,
    );
    expect(dayTotals[0]).toBe(12); // 8+4
    expect(dayTotals[1]).toBe(6);
    expect(weekTotal).toBe(18);
  });
});

describe('calcGridModel — сортировка', () => {
  it('строки сортируются по projectName, затем workTypeName', () => {
    const { rowList } = calcGridModel(
      [
        entry('p2', 'w1', '2026-06-22', 1),
        entry('p1', 'w2', '2026-06-22', 1),
        entry('p1', 'w1', '2026-06-22', 1),
      ],
      [proj('p1', 'Альфа'), proj('p2', 'Бета')],
      [wt('w1', 'Аудит'), wt('w2', 'Разработка')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].projectName).toBe('Альфа');
    expect(rowList[0].workTypeName).toBe('Аудит');
    expect(rowList[1].projectName).toBe('Альфа');
    expect(rowList[1].workTypeName).toBe('Разработка');
    expect(rowList[2].projectName).toBe('Бета');
  });
});

describe('calcGridModel — extraRowKeys', () => {
  it('extraRowKey добавляет пустую строку (0 часов)', () => {
    const { rowList } = calcGridModel(
      [],
      [proj('p1', 'Проект А')],
      [wt('w1', 'Разработка')],
      DAYS, ['p1|w1'], NO_FILTERS,
    );
    expect(rowList).toHaveLength(1);
    expect(rowList[0].rowTotal).toBe(0);
    expect(rowList[0].hoursByDay).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('calcGridModel — проект/вид не в справочнике', () => {
  it('неизвестный проект → дефолт "Проект"', () => {
    const { rowList } = calcGridModel(
      [entry('unknown', 'w1', '2026-06-22', 8)],
      [],
      [wt('w1', 'R')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].projectName).toBe('Проект');
    expect(rowList[0].category).toBeNull();
  });

  it('неизвестный вид → дефолт "Без вида работ"', () => {
    const { rowList } = calcGridModel(
      [entry('p1', 'unknown', '2026-06-22', 8)],
      [proj('p1', 'А')],
      [],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].workTypeName).toBe('Без вида работ');
  });
});

describe('calcGridModel — категория проекта', () => {
  it('проект с category → строка наследует category', () => {
    const { rowList } = calcGridModel(
      [entry('p1', 'w1', '2026-06-22', 8)],
      [proj('p1', 'Проект', 'CLIENT')],
      [wt('w1', 'R')],
      DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].category).toBe('CLIENT');
  });
});

describe('calcGridModel — фильтр status (W3-3)', () => {
  const withStatus = (status: string | null): ApiEntry => ({
    id: `e1`, date: '2026-06-22', hours: 8,
    description: null, projectId: 'p1', workTypeId: 'w1', status,
  });

  const statusFilter = (...statuses: string[]): FilterState => ({
    ...NO_FILTERS, status: new Set(statuses),
  });

  it('пустой фильтр status → все записи (нет ограничений)', () => {
    const { rowList } = calcGridModel(
      [withStatus('DRAFT'), withStatus('SUBMITTED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], NO_FILTERS,
    );
    expect(rowList[0].hoursByDay[0]).toBe(16); // обе записи суммируются
  });

  it('фильтр SUBMITTED → только SUBMITTED-записи', () => {
    const { rowList } = calcGridModel(
      [withStatus('DRAFT'), withStatus('SUBMITTED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], statusFilter('SUBMITTED'),
    );
    expect(rowList[0].hoursByDay[0]).toBe(8); // только SUBMITTED
  });

  it('фильтр DRAFT → только DRAFT-записи', () => {
    const { rowList } = calcGridModel(
      [withStatus('DRAFT'), withStatus('APPROVED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], statusFilter('DRAFT'),
    );
    expect(rowList[0].hoursByDay[0]).toBe(8);
  });

  it('фильтр APPROVED → запись со status=null не проходит', () => {
    const { rowList } = calcGridModel(
      [withStatus(null), withStatus('APPROVED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], statusFilter('APPROVED'),
    );
    expect(rowList[0].hoursByDay[0]).toBe(8); // null → '' не в Set(['APPROVED'])
  });

  it('фильтр нескольких статусов: DRAFT|SUBMITTED', () => {
    const { rowList } = calcGridModel(
      [withStatus('DRAFT'), withStatus('SUBMITTED'), withStatus('APPROVED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], statusFilter('DRAFT', 'SUBMITTED'),
    );
    expect(rowList[0].hoursByDay[0]).toBe(16); // DRAFT + SUBMITTED, APPROVED отфильтрован
  });

  it('фильтр статуса убирает строку если все записи отфильтрованы', () => {
    const { rowList } = calcGridModel(
      [withStatus('APPROVED')],
      [proj('p1', 'A')], [wt('w1', 'R')], DAYS, [], statusFilter('DRAFT'),
    );
    expect(rowList).toHaveLength(0); // строка не создаётся без записей
  });
});
