import { describe, expect, it } from 'vitest';

import {
  computePreview,
  monthsInRange,
  openEndedHint,
  previewBuckets,
  previewDeptsForProject,
  previewGranularity,
  previewLoadCtxFor,
  reconcileSlots,
  sumSlotHours,
  utilPct,
  validateRange,
  type PreviewSource,
} from 'src/front-components/capacity/plan-preview';
import { buildBookingCtx, buildSharesByProject } from 'src/front-components/capacity/calc-load';
import type {
  Booking,
  CapProject,
  DeptRef,
  EmployeeRef,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

// Производственный календарь: будни (Пн–Пт) по 8 ч, выходные отсутствуют (=0 ч).
const buildWeekdayCalendar = (startKey: string, days: number): Map<string, number> => {
  const m = new Map<string, number>();
  const base = Date.parse(`${startKey}T00:00:00.000Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(base + i * 86400000);
    const dow = d.getUTCDay(); // 0=вс 6=сб
    if (dow !== 0 && dow !== 6) m.set(d.toISOString().slice(0, 10), 8);
  }
  return m;
};

const dept: DeptRef = {
  id: 'd1',
  name: 'ОПИБ',
  code: null,
  headcount: 2,
  capacityFactor: 1,
};

describe('validateRange', () => {
  it('требует дату начала', () => {
    expect(validateRange('', '2026-07-31')).toBe('укажите дату начала «С»');
  });

  it('WI-48 W3B.23: пустой ПО больше НЕ ошибка (открытый план до горизонта)', () => {
    expect(validateRange('2026-07-01', '')).toBeNull();
  });

  it('запрещает ПО раньше С', () => {
    expect(validateRange('2026-07-10', '2026-07-01')).toBe('дата «ПО» раньше «С»');
  });

  it('валидный диапазон → null', () => {
    expect(validateRange('2026-07-01', '2026-09-13')).toBeNull();
  });
});

describe('openEndedHint (W3B.23)', () => {
  it('пустой ПО → подсказка «открытый план»', () => {
    expect(openEndedHint('')).toBe('открытый план — раскид до конца горизонта доски');
  });
  it('заполненный ПО → нет подсказки', () => {
    expect(openEndedHint('2026-09-13')).toBeNull();
  });
});

describe('previewGranularity', () => {
  it('короткий диапазон (≤70 дн) → недели', () => {
    expect(previewGranularity('2026-07-01', '2026-07-31')).toBe('week');
  });

  it('длинный диапазон → месяцы', () => {
    expect(previewGranularity('2026-07-01', '2026-10-31')).toBe('month');
  });
});

describe('previewBuckets', () => {
  it('невалидный/пустой диапазон → []', () => {
    expect(previewBuckets('', '2026-07-31', new Map(), 'month')).toEqual([]);
    expect(previewBuckets('2026-08-01', '2026-07-01', new Map(), 'month')).toEqual([]);
  });

  it('месяцы покрывают весь диапазон С..ПО', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const buckets = previewBuckets('2026-07-01', '2026-09-13', cal, 'month');
    expect(buckets.map((b) => b.label)).toEqual(['июл 26', 'авг 26', 'сен 26']);
    // у каждого месяца workHours > 0 (есть будни)
    expect(buckets.every((b) => b.workHours > 0)).toBe(true);
  });
});

describe('computePreview', () => {
  it('Σ раскида ≈ plannedEffort (инвариант WI-05)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const res = computePreview(480, '2026-07-01', '2026-09-13', cal);
    expect(res.rows.length).toBe(3); // 3 месяца
    expect(res.total).toBeCloseTo(480, 5);
  });

  it('раскид по РАБОЧИМ дням: месяц с большим числом будней получает больше часов', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const res = computePreview(480, '2026-07-01', '2026-09-13', cal);
    const jul = res.rows.find((r) => r.label === 'июл 26')!;
    const sep = res.rows.find((r) => r.label === 'сен 26')!;
    // июль — полный месяц, сентябрь — обрезан по 13-е → июль > сентября
    expect(jul.hours).toBeGreaterThan(sep.hours);
  });

  it('овербукинг: план периода > ёмкости отдела → over=true', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    // огромный объём на короткий период точно превысит ёмкость 2 чел
    const res = computePreview(2000, '2026-07-01', '2026-07-31', cal, dept);
    expect(res.rows.some((r) => r.over)).toBe(true);
    expect(res.rows.every((r) => r.capacity !== null)).toBe(true);
  });

  it('без отдела овербукинг не считается (capacity=null, over=false)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    const res = computePreview(2000, '2026-07-01', '2026-07-31', cal);
    expect(res.rows.every((r) => r.capacity === null && r.over === false)).toBe(true);
  });

  it('нулевой/пустой объём → раскид 0', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    const res = computePreview(null, '2026-07-01', '2026-07-31', cal);
    expect(res.total).toBe(0);
  });

  it('overCount считает периоды с овербукингом (W3B.21)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    const res = computePreview(2000, '2026-07-01', '2026-07-31', cal, dept);
    expect(res.overCount).toBe(res.rows.filter((r) => r.over).length);
    expect(res.overCount).toBeGreaterThan(0);
  });
});

// ── WI-48 W3B.18: овербукинг vs СВОБОДНОЙ ёмкости (минус занятое) ──────────────
describe('computePreview — свободная ёмкость (W3B.18)', () => {
  const mkProject = (id: string, deptId: string, effort: number): CapProject => ({
    id,
    code: null,
    name: id,
    departmentId: deptId,
    plannedEffort: effort,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  });
  const planned = mkProject('plan-me', 'd1', 0);

  it('свободная ёмкость < полной, когда отдел занят другим проектом', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 40);
    // Полная ёмкость июля: ~23 будня × 8 × 2 чел = ~368 ч.
    // Другой проект отдела d1 занимает 300 ч в том же июле → свободно ~68 ч.
    const other = mkProject('other', 'd1', 300);
    const source: PreviewSource = { depts: [dept], projects: [other, planned] };
    const free = computePreview(100, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(planned, source));
    const fullOnly = computePreview(100, '2026-07-01', '2026-07-31', cal, dept);
    const fRow = free.rows.find((r) => r.over !== undefined)!;
    const fuRow = fullOnly.rows[0];
    // capacity у free-варианта строго меньше полной (вычли 300 ч).
    expect((fRow.capacity ?? 0)).toBeLessThan(fuRow.capacity ?? 0);
    expect(fRow.fullCapacity).toBeCloseTo(fuRow.capacity ?? 0, 0);
  });

  it('план 100 ч: НЕ овербукинг против полной, НО овербукинг против свободной', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 40);
    const other = mkProject('other', 'd1', 320); // почти вся ёмкость занята
    const source: PreviewSource = { depts: [dept], projects: [other, planned] };
    const full = computePreview(100, '2026-07-01', '2026-07-31', cal, dept);
    const free = computePreview(100, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(planned, source));
    expect(full.overCount).toBe(0); // 100 < 368 полной
    expect(free.overCount).toBeGreaterThan(0); // 100 > свободной (~48)
  });

  it('сам планируемый проект НЕ вычитается из свободной ёмкости (excludeProjectId)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 40);
    // planned уже имеет 300 ч на доске, но при превью его старое значение игнорим.
    const onBoard = mkProject('plan-me', 'd1', 300);
    const source: PreviewSource = { depts: [dept], projects: [onBoard] };
    const free = computePreview(100, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(onBoard, source));
    // Свободная ≈ полная (себя не вычли) → 100 ч не овербукинг.
    expect(free.overCount).toBe(0);
  });

  it('HARD-бронь потребляет ёмкость (вычитается), SOFT — нет', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 40);
    const employees: EmployeeRef[] = [
      { id: 'e1', name: 'A', departmentId: 'd1' },
      { id: 'e2', name: 'B', departmentId: 'd1' },
    ];
    const hardBooking: Booking = {
      id: 'b1', employeeId: 'e1', projectId: null, bookingType: 'HARD',
      hours: 300, startDate: '2026-07-01', endDate: '2026-07-31',
    };
    const softBooking: Booking = {
      id: 'b2', employeeId: 'e1', projectId: null, bookingType: 'SOFT',
      hours: 300, startDate: '2026-07-01', endDate: '2026-07-31',
    };
    const srcHard: PreviewSource = {
      depts: [dept], projects: [planned],
      bookingCtx: buildBookingCtx([hardBooking], employees, true),
    };
    const srcSoft: PreviewSource = {
      depts: [dept], projects: [planned],
      bookingCtx: buildBookingCtx([softBooking], employees, true),
    };
    const withHard = computePreview(100, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(planned, srcHard));
    const withSoft = computePreview(100, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(planned, srcSoft));
    expect(withHard.overCount).toBeGreaterThan(0); // HARD съел ёмкость → 100 не влезает
    expect(withSoft.overCount).toBe(0); // SOFT не потребляет → влезает
  });
});

// ── WI-48 W3B.22: мульти-отдел (доли sharesByProject) ─────────────────────────
describe('previewDeptsForProject + мульти-отдел (W3B.22)', () => {
  const d1: DeptRef = { id: 'd1', name: 'ОПИБ', code: null, headcount: 2, capacityFactor: 1 };
  const d2: DeptRef = { id: 'd2', name: 'Разработка', code: null, headcount: 3, capacityFactor: 1 };
  const proj: CapProject = {
    id: 'p1', code: null, name: 'Мульти', departmentId: 'd1',
    plannedEffort: 0, startDate: '2026-07-01', endDate: '2026-07-31',
  };

  it('проект с долями → возвращает все долевые отделы, не один', () => {
    const shares: ProjectDeptShare[] = [
      { projectId: 'p1', departmentId: 'd1', plannedEffortShare: 100 },
      { projectId: 'p1', departmentId: 'd2', plannedEffortShare: 100 },
    ];
    const sbp = buildSharesByProject(shares);
    const depts = previewDeptsForProject(proj, [d1, d2], sbp);
    expect(depts.map((d) => d.id).sort()).toEqual(['d1', 'd2']);
  });

  it('проект без долей → fallback на «родной» departmentId', () => {
    const depts = previewDeptsForProject(proj, [d1, d2], undefined);
    expect(depts.map((d) => d.id)).toEqual(['d1']);
  });

  it('свободная ёмкость = сумма ёмкостей долевых отделов (а не одного)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 40);
    const shares: ProjectDeptShare[] = [
      { projectId: 'p1', departmentId: 'd1', plannedEffortShare: 100 },
      { projectId: 'p1', departmentId: 'd2', plannedEffortShare: 100 },
    ];
    const source: PreviewSource = {
      depts: [d1, d2], projects: [proj], sharesByProject: buildSharesByProject(shares),
    };
    const multi = computePreview(200, '2026-07-01', '2026-07-31', cal, previewLoadCtxFor(proj, source));
    const singleOnly = computePreview(200, '2026-07-01', '2026-07-31', cal, d1);
    // ёмкость 2 отделов (2+3=5 чел) больше, чем одного (2 чел).
    expect((multi.rows[0].capacity ?? 0)).toBeGreaterThan(singleOnly.rows[0].capacity ?? 0);
  });

  it('previewLoadCtxFor → undefined, когда нет отделов', () => {
    const orphan: CapProject = { ...proj, departmentId: null };
    expect(previewLoadCtxFor(orphan, { depts: [d1], projects: [] })).toBeUndefined();
    expect(previewLoadCtxFor(orphan, undefined)).toBeUndefined();
  });
});

// ── WI-48 W3B.23: open-ended endDate (пусто → до горизонта) ────────────────────
describe('computePreview — open-ended endDate (W3B.23)', () => {
  it('пустой endKey + horizonEnd → раскид до горизонта (как доска)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const ctx = previewLoadCtxFor(
      { id: 'p', code: null, name: 'p', departmentId: 'd1', plannedEffort: 0, startDate: '2026-07-01', endDate: null },
      { depts: [dept], projects: [], horizonEnd: '2026-09-30' },
    );
    const res = computePreview(480, '2026-07-01', '', cal, ctx);
    expect(res.rows.length).toBeGreaterThan(0); // не пусто, хотя ПО пустая
    expect(res.total).toBeCloseTo(480, 5); // инвариант Σ держится до горизонта
  });

  it('пустой endKey без horizonEnd → превью пусто (back-compat)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const res = computePreview(480, '2026-07-01', '', cal, dept);
    expect(res.rows).toEqual([]);
    expect(res.total).toBe(0);
  });
});

// ── W3B.16: util% периода (план / свободная ёмкость) ───────────────────────────
describe('utilPct — утилизация периода', () => {
  it('план / свободная ёмкость', () => {
    expect(utilPct({ hours: 40, capacity: 80 })).toBe(0.5);
    expect(utilPct({ hours: 80, capacity: 80 })).toBe(1);
  });
  it('овербукинг → > 1', () => {
    expect(utilPct({ hours: 120, capacity: 80 })).toBeGreaterThan(1);
  });
  it('нет ёмкости (null / 0) → null', () => {
    expect(utilPct({ hours: 40, capacity: null })).toBeNull();
    expect(utilPct({ hours: 40, capacity: 0 })).toBeNull();
  });
});

describe('monthsInRange (WI-47)', () => {
  it('месяцы внутри одного года, ключ YYYY-MM и метка', () => {
    const out = monthsInRange('2026-02-10', '2026-04-20');
    expect(out.map((m) => m.periodMonth)).toEqual(['2026-02', '2026-03', '2026-04']);
    expect(out[0].label).toBe('фев 26');
    expect(out[2].label).toBe('апр 26');
  });

  it('один месяц, когда С и ПО в одном месяце', () => {
    expect(monthsInRange('2026-06-01', '2026-06-30').map((m) => m.periodMonth)).toEqual(['2026-06']);
  });

  it('переход через год', () => {
    expect(monthsInRange('2025-11-15', '2026-02-01').map((m) => m.periodMonth)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('пустой/невалидный диапазон → []', () => {
    expect(monthsInRange('', '2026-04-01')).toEqual([]);
    expect(monthsInRange('2026-04-01', '')).toEqual([]);
    expect(monthsInRange('2026-05-01', '2026-04-01')).toEqual([]); // ПО раньше С
    expect(monthsInRange('xxxx', '2026-04-01')).toEqual([]);
  });

  it('месяц с однозначным номером дополняется нулём (padStart)', () => {
    expect(monthsInRange('2026-01-01', '2026-01-31')[0].periodMonth).toBe('2026-01');
  });
});

describe('sumSlotHours (WI-47)', () => {
  it('Σ часов, null/нечисло игнорируются', () => {
    expect(sumSlotHours([{ plannedHours: 40 }, { plannedHours: null }, { plannedHours: 20 }])).toBe(60);
  });

  it('пустой список → 0', () => {
    expect(sumSlotHours([])).toBe(0);
  });

  it('округление до 2 знаков (без плавающего хвоста)', () => {
    expect(sumSlotHours([{ plannedHours: 0.1 }, { plannedHours: 0.2 }])).toBe(0.3);
  });
});

describe('reconcileSlots (WI-47 Σ-сверка)', () => {
  it('Σ совпадает с объёмом → ok', () => {
    const r = reconcileSlots([{ plannedHours: 50 }, { plannedHours: 50 }], 100);
    expect(r).toEqual({ sum: 100, target: 100, ok: true });
  });

  it('допуск 1 ч → ok', () => {
    expect(reconcileSlots([{ plannedHours: 99.5 }], 100).ok).toBe(true);
    expect(reconcileSlots([{ plannedHours: 101 }], 100).ok).toBe(true);
  });

  it('расхождение больше 1 ч → не ok', () => {
    const r = reconcileSlots([{ plannedHours: 80 }], 100);
    expect(r.sum).toBe(80);
    expect(r.ok).toBe(false);
  });

  it('объём не задан (null) → не ok, target 0', () => {
    expect(reconcileSlots([{ plannedHours: 40 }], null)).toEqual({ sum: 40, target: 0, ok: false });
  });
});
