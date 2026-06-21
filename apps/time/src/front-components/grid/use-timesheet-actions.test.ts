import { describe, expect, it } from 'vitest';

import {
  calcClearRow,
  calcClearWeek,
  calcCopyWithHours,
  calcFillRowWeekdays,
  calcFillStandardWeek,
  isCellLocked,
} from './use-timesheet-actions';
import type { NormForDay } from './use-daily-norm';
import type { WeekDay } from './use-week';
import type { ApiEntry } from './types';
import type { GridRowModel } from './use-grid-model';

// Вспомогательные фабрики

const day = (iso: string, isWeekend = false): WeekDay => ({
  iso,
  dayLabel: iso.slice(8, 10),
  fullLabel: iso,
  dateLabel: iso.slice(8),
  isWeekend,
  isToday: false,
});

// WI-02: норма дня (SSOT). Плоская: будни 8ч, выходные 0 — эквивалент старого
// хардкода DAILY_NORM_HOURS, чтобы существующие ассерты (hours===8) держались.
const NORM_FLAT8: NormForDay = (_iso, isWeekend) => (isWeekend ? 0 : 8);

// WI-02: норма с коротким днём (праздничный/предпраздничный) — проверка SSOT:
// fill льёт часы дня, а не 8. 2026-06-24 = 7ч.
const NORM_SHORT_WED: NormForDay = (iso, isWeekend) => {
  if (isWeekend) return 0;
  return iso === '2026-06-24' ? 7 : 8;
};

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

  // WI-07/CISO-011 §F6 (UC-TS-10): пустая APPROVED-ячейка тек.недели — read-only,
  // copy-week в неё НЕ пишет (передаём rowList с lockedByDay).
  it('пустая согласованная ячейка тек.недели → не перетирается копированием', () => {
    const prev = [entry('2026-06-15', 8)]; // прошлая Пн → тек. Пн 2026-06-22
    // Строка тек.недели: Пн заблокирован (APPROVED), но без часов.
    const lockedMon = [true, false, false, false, false, false, false];
    const rows = [row(Array(7).fill(0), lockedMon)];
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev, rows);
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(false); // guard сработал
  });

  it('несогласованная пустая ячейка → копируется как обычно', () => {
    const prev = [entry('2026-06-15', 8)];
    const rows = [row(Array(7).fill(0))]; // без блокировок
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev, rows);
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(true);
  });

  it('rowList не передан → поведение прежнее (lock-look-up пуст)', () => {
    const prev = [entry('2026-06-15', 8)];
    const { inputs } = calcCopyWithHours(CUR_WEEK, prev);
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(true);
  });
});

// REQ-0015 §2: шаблон «8×5»
const row = (
  hoursByDay: number[],
  lockedByDay: boolean[] = Array(7).fill(false),
  projectId = 'proj-1',
  workTypeId = 'wt-1',
): GridRowModel => ({
  key: `${projectId}|${workTypeId}`,
  projectId,
  workTypeId,
  projectName: 'Проект',
  category: null,
  workTypeName: 'Разработка',
  hoursByDay,
  entryIdByDay: Array(7).fill(null),
  descByDay: Array(7).fill(null),
  lockedByDay,
  tags: [],
  rowTotal: hoursByDay.reduce((s, n) => s + n, 0),
});

// Строка с явными entryId по дням (для clearRow/clearWeek).
const rowWithIds = (
  ids: (string | null)[],
  lockedByDay: boolean[] = Array(7).fill(false),
  projectId = 'proj-1',
  workTypeId = 'wt-1',
): GridRowModel => ({
  key: `${projectId}|${workTypeId}`,
  projectId,
  workTypeId,
  projectName: 'Проект',
  category: null,
  workTypeName: 'Разработка',
  hoursByDay: ids.map((id) => (id ? 8 : 0)),
  entryIdByDay: ids,
  descByDay: Array(7).fill(null),
  lockedByDay,
  tags: [],
  rowTotal: ids.filter(Boolean).length * 8,
});

describe('calcClearRow', () => {
  it('собирает все entryId строки на удаление', () => {
    const rows = [rowWithIds(['e1', 'e2', null, null, 'e5', null, null])];
    const { ids, skippedLocked } = calcClearRow(rows, 'proj-1|wt-1');
    expect(ids).toEqual(['e1', 'e2', 'e5']);
    expect(skippedLocked).toBe(false);
  });

  it('согласованную (locked) ячейку пропускает и помечает skippedLocked', () => {
    const locked = [true, false, false, false, false, false, false];
    const rows = [rowWithIds(['e1', 'e2', null, null, null, null, null], locked)];
    const { ids, skippedLocked } = calcClearRow(rows, 'proj-1|wt-1');
    expect(ids).toEqual(['e2']);
    expect(skippedLocked).toBe(true);
  });

  it('неизвестный rowKey → пусто, без падения', () => {
    const rows = [rowWithIds(['e1', null, null, null, null, null, null])];
    const { ids, skippedLocked } = calcClearRow(rows, 'нет|такой');
    expect(ids).toHaveLength(0);
    expect(skippedLocked).toBe(false);
  });

  it('строка без записей → пустой результат', () => {
    const rows = [rowWithIds(Array(7).fill(null))];
    expect(calcClearRow(rows, 'proj-1|wt-1').ids).toHaveLength(0);
  });
});

describe('calcClearWeek', () => {
  it('собирает записи всех строк недели', () => {
    const rows = [
      rowWithIds(['a1', null, null, null, null, null, null], undefined, 'p1', 'w1'),
      rowWithIds(['b1', 'b2', null, null, null, null, null], undefined, 'p2', 'w2'),
    ];
    const { ids, skippedLocked } = calcClearWeek(rows);
    expect(ids).toEqual(['a1', 'b1', 'b2']);
    expect(skippedLocked).toBe(false);
  });

  it('согласованные ячейки пропускаются, skippedLocked=true', () => {
    const locked = [true, false, false, false, false, false, false];
    const rows = [rowWithIds(['a1', 'a2', null, null, null, null, null], locked, 'p1', 'w1')];
    const { ids, skippedLocked } = calcClearWeek(rows);
    expect(ids).toEqual(['a2']);
    expect(skippedLocked).toBe(true);
  });

  it('пустая неделя → пустой результат', () => {
    expect(calcClearWeek([]).ids).toHaveLength(0);
  });
});

describe('calcFillStandardWeek', () => {
  it('пустая строка → 8ч во все 5 будней, выходные не трогаются', () => {
    const inputs = calcFillStandardWeek([row(Array(7).fill(0))], CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(5);
    expect(inputs.every((i) => i.hours === 8)).toBe(true);
    expect(inputs.map((i) => i.date)).toEqual([
      '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26',
    ]);
  });

  it('заполненные будни не перетираются', () => {
    const inputs = calcFillStandardWeek([row([4, 0, 0, 0, 0, 0, 0])], CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(4); // Пн уже 4ч — пропущен
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(false);
  });

  it('заблокированная (согласованная) ячейка пропускается', () => {
    const locked = [true, false, false, false, false, false, false];
    const inputs = calcFillStandardWeek([row(Array(7).fill(0), locked)], CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(4);
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(false);
  });

  it('несколько строк → 8ч в будни каждой', () => {
    const inputs = calcFillStandardWeek(
      [row(Array(7).fill(0), undefined, 'p1', 'w1'), row(Array(7).fill(0), undefined, 'p2', 'w2')],
      CUR_WEEK,
      NORM_FLAT8,
    );
    expect(inputs).toHaveLength(10);
  });

  it('полностью заполненная неделя → пустой результат', () => {
    const inputs = calcFillStandardWeek([row([8, 8, 8, 8, 8, 0, 0])], CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(0);
  });

  it('id всегда undefined (новые записи)', () => {
    const inputs = calcFillStandardWeek([row(Array(7).fill(0))], CUR_WEEK, NORM_FLAT8);
    expect(inputs.every((i) => i.id === undefined)).toBe(true);
  });

  // WI-02/A1.12/A4.8: норма дня = SSOT (useDailyNorm), не хардкод 8.
  it('короткий день календаря → его часы (7), а не 8', () => {
    const inputs = calcFillStandardWeek([row(Array(7).fill(0))], CUR_WEEK, NORM_SHORT_WED);
    const wed = inputs.find((i) => i.date === '2026-06-24');
    expect(wed?.hours).toBe(7); // Ср = короткий день
    expect(inputs.find((i) => i.date === '2026-06-22')?.hours).toBe(8); // Пн обычный
  });

  it('норма дня 0 (нерабочий по календарю) → ячейку не заполняем', () => {
    // Все будни норма 0 → пусто
    const normZero: NormForDay = () => 0;
    const inputs = calcFillStandardWeek([row(Array(7).fill(0))], CUR_WEEK, normZero);
    expect(inputs).toHaveLength(0);
  });
});

// WI-06/A1.13: «Заполнить будни нормой» (меню одной строки) — норма дня в пустые
// несогласованные будни ЭТОЙ строки.
describe('calcFillRowWeekdays', () => {
  it('пустая строка → норма во все 5 будней', () => {
    const inputs = calcFillRowWeekdays([row(Array(7).fill(0))], 'proj-1|wt-1', CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(5);
    expect(inputs.every((i) => i.hours === 8)).toBe(true);
  });

  it('короткий день → его часы (WI-02 SSOT)', () => {
    const inputs = calcFillRowWeekdays([row(Array(7).fill(0))], 'proj-1|wt-1', CUR_WEEK, NORM_SHORT_WED);
    expect(inputs.find((i) => i.date === '2026-06-24')?.hours).toBe(7);
  });

  it('заполняет только указанную строку, не трогает другие', () => {
    const rows = [
      row(Array(7).fill(0), undefined, 'p1', 'w1'),
      row(Array(7).fill(0), undefined, 'p2', 'w2'),
    ];
    const inputs = calcFillRowWeekdays(rows, 'p1|w1', CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(5);
    expect(inputs.every((i) => i.projectId === 'p1')).toBe(true);
  });

  it('заполненные/согласованные будни пропускаются', () => {
    const locked = [true, false, false, false, false, false, false];
    const inputs = calcFillRowWeekdays([row([0, 4, 0, 0, 0, 0, 0], locked)], 'proj-1|wt-1', CUR_WEEK, NORM_FLAT8);
    // Пн locked, Вт уже 4ч → остаются Ср/Чт/Пт = 3
    expect(inputs).toHaveLength(3);
    expect(inputs.some((i) => i.date === '2026-06-22')).toBe(false);
    expect(inputs.some((i) => i.date === '2026-06-23')).toBe(false);
  });

  it('неизвестный rowKey → пусто, без падения', () => {
    const inputs = calcFillRowWeekdays([row(Array(7).fill(0))], 'нет|такой', CUR_WEEK, NORM_FLAT8);
    expect(inputs).toHaveLength(0);
  });
});

// W6-2/CISO-012: lock-approved — read-only согласованной ячейки в гриде.
// isCellLocked — SSOT-предикат, на котором стоит no-op гард commitCell
// (фронт пишет напрямую Core REST мимо серверного cannot_modify_approved).
describe('isCellLocked', () => {
  const LOCKED_MON = [true, false, false, false, false, false, false];

  it('согласованная (APPROVED) ячейка → locked', () => {
    const rows = [row(Array(7).fill(8), LOCKED_MON)];
    expect(isCellLocked(rows, CUR_WEEK, 'proj-1|wt-1', '2026-06-22')).toBe(true);
  });

  it('несогласованная ячейка той же строки → не locked', () => {
    const rows = [row(Array(7).fill(8), LOCKED_MON)];
    expect(isCellLocked(rows, CUR_WEEK, 'proj-1|wt-1', '2026-06-23')).toBe(false);
  });

  it('строка без блокировок → не locked', () => {
    const rows = [row(Array(7).fill(8))];
    expect(isCellLocked(rows, CUR_WEEK, 'proj-1|wt-1', '2026-06-22')).toBe(false);
  });

  it('неизвестный rowKey → не locked (без падения)', () => {
    const rows = [row(Array(7).fill(8), LOCKED_MON)];
    expect(isCellLocked(rows, CUR_WEEK, 'нет|такой', '2026-06-22')).toBe(false);
  });

  it('дата вне недели → не locked', () => {
    const rows = [row(Array(7).fill(8), LOCKED_MON)];
    expect(isCellLocked(rows, CUR_WEEK, 'proj-1|wt-1', '2030-01-01')).toBe(false);
  });
});
