import { describe, expect, it } from 'vitest';

import {
  absenceHoursByEmpInPeriod,
  absenceHoursInPeriod,
  buildAbsenceCtx,
  buildBookingCtx,
  buildHoursByDay,
  buildPeriods,
  buildSharesByProject,
  bookingHoursInPeriod,
  deptBookingHours,
  deptCapacity,
  deptLoadCells,
  deptPlanHoursInPeriod,
  deptPlanLoads,
  deptProjectLoads,
  employeeLoadCells,
  firstFreePeriod,
  fteHeadcountByDept,
  isAssignmentActive,
  plannedHoursInPeriod,
  projectDeptHoursInPeriod,
  projectDeptShareLoads,
  projectHoursInPeriod,
  projectShareHoursInPeriod,
  buildSlotsByProject,
  monthRange,
  slotsHoursInPeriod,
  slotsVsPlannedEffort,
  sumSlotHours,
  summaryCells,
} from 'src/front-components/capacity/calc-load';
import type {
  Absence,
  CalendarDay,
  CapProject,
  Booking,
  DeptPlan,
  DeptRef,
  EmpDeptAssignment,
  EmployeeRef,
  LoadCell,
  Period,
  PlanSlot,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

// LoadCell-фикстура: ratio и free выводятся из capacity/load (как в calc-load).
const cell = (capacity: number, load: number): LoadCell => ({
  capacity,
  load,
  free: capacity - load,
  ratio: capacity > 0 ? load / capacity : null,
  hardBooking: 0,
  softBooking: 0,
  conflict: false,
});

const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d));

const period = (key: string, from: Date, to: Date, workHours: number): Period => ({
  key,
  label: key,
  from,
  to,
  workHours,
});

const dept = (over: Partial<DeptRef> = {}): DeptRef => ({
  id: 'd1',
  name: 'Отдел',
  code: 'DEV',
  headcount: 5,
  capacityFactor: 0.8,
  ...over,
});

const project = (over: Partial<CapProject> = {}): CapProject => ({
  id: 'p1',
  code: 'DEV-2026-001',
  name: 'Проект',
  departmentId: 'd1',
  plannedEffort: 100,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  ...over,
});

// REQ-0012: плановая загрузка отдела без проекта (раскид той же логикой).
const deptPlan = (over: Partial<DeptPlan> = {}): DeptPlan => ({
  id: 'dp1',
  label: 'Резерв',
  departmentId: 'd1',
  category: null,
  plannedEffort: 100,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  ...over,
});

// W3-1: отсутствие сотрудника (раскид по рабочим дням ∩ периода).
const absence = (over: Partial<Absence> = {}): Absence => ({
  employeeId: 'e1',
  startDate: '2026-01-12',
  endDate: '2026-01-14',
  ...over,
});

// Будни 2026-01-12..2026-01-25 по 8ч, выходные 0. Покрывает 2 недели.
const calendar: CalendarDay[] = (() => {
  const out: CalendarDay[] = [];
  for (let d = 12; d <= 25; d++) {
    const date = utc(2026, 0, d);
    const dow = date.getUTCDay(); // 0=вс, 6=сб
    out.push({
      date: `2026-01-${String(d).padStart(2, '0')}`,
      hours: dow === 0 || dow === 6 ? 0 : 8,
    });
  }
  return out;
})();

describe('buildPeriods (week)', () => {
  const periods = buildPeriods(utc(2026, 0, 15), calendar, 'week', 2);

  it('выравнивает на понедельник недели якоря', () => {
    expect(periods).toHaveLength(2);
    expect(periods[0].key).toBe('2026-01-12');
    expect(periods[0].from.toISOString().slice(0, 10)).toBe('2026-01-12');
    expect(periods[0].to.toISOString().slice(0, 10)).toBe('2026-01-18');
  });

  it('суммирует рабочие часы недели (5×8 = 40, выходные 0)', () => {
    expect(periods[0].workHours).toBe(40);
    expect(periods[1].workHours).toBe(40);
  });

  it('вторая колонка начинается со следующего понедельника', () => {
    expect(periods[1].key).toBe('2026-01-19');
  });

  it('подпись колонки — день + русский месяц', () => {
    expect(periods[0].label).toBe('12 янв');
  });
});

describe('buildPeriods (month)', () => {
  const periods = buildPeriods(utc(2026, 0, 15), calendar, 'month', 2);

  it('перебирает месяцы с переходом через границу года', () => {
    expect(periods[0].key).toBe('2026-0');
    expect(periods[0].from.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(periods[0].to.toISOString().slice(0, 10)).toBe('2026-01-31');
    expect(periods[1].to.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('подпись — месяц + 2 цифры года', () => {
    expect(periods[0].label).toBe('янв 26');
    expect(periods[1].label).toBe('фев 26');
  });
});

describe('deptCapacity', () => {
  it('= рабочие часы × headcount × коэффициент', () => {
    expect(deptCapacity(dept(), period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40))).toBe(160);
  });

  it('headcount 0 → ёмкость 0', () => {
    expect(deptCapacity(dept({ headcount: 0 }), period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40))).toBe(0);
  });
});

describe('projectHoursInPeriod', () => {
  const p = period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40); // 5 дней

  it('раскидывает план равномерно по дням и берёт пересечение', () => {
    // проект 2026-01-01..01-10 = 10 дней, план 100 → 10ч/день; пересечение 5 дней → 50
    expect(projectHoursInPeriod(project(), p)).toBe(50);
  });

  it('0 без плана или без дат', () => {
    expect(projectHoursInPeriod(project({ plannedEffort: null }), p)).toBe(0);
    expect(projectHoursInPeriod(project({ startDate: null }), p)).toBe(0);
    expect(projectHoursInPeriod(project({ endDate: null }), p)).toBe(0);
  });

  it('0 при отсутствии пересечения', () => {
    const far = period('w', utc(2026, 5, 1), utc(2026, 5, 7), 40);
    expect(projectHoursInPeriod(project(), far)).toBe(0);
  });

  it('0 при endDate < startDate (некорректный диапазон)', () => {
    expect(projectHoursInPeriod(project({ startDate: '2026-01-10', endDate: '2026-01-01' }), p)).toBe(0);
  });

  it('проект целиком внутри периода → весь план', () => {
    const wide = period('w', utc(2025, 11, 1), utc(2026, 1, 1), 40);
    expect(projectHoursInPeriod(project(), wide)).toBe(100);
  });
});

describe('deptLoadCells', () => {
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];

  it('считает ёмкость, загрузку и ratio, фильтрует по отделу', () => {
    const projects = [
      project(),
      project({ id: 'p2', departmentId: 'other' }), // чужой отдел — игнор
    ];
    const [cell] = deptLoadCells(dept(), projects, periods);
    expect(cell.capacity).toBe(160);
    expect(cell.load).toBe(50);
    expect(cell.ratio).toBeCloseTo(50 / 160);
  });

  it('ratio = null при нулевой ёмкости', () => {
    const [cell] = deptLoadCells(dept({ headcount: 0 }), [project()], periods);
    expect(cell.capacity).toBe(0);
    expect(cell.ratio).toBeNull();
  });
});

describe('deptProjectLoads', () => {
  const periods = [
    period('w1', utc(2026, 0, 1), utc(2026, 0, 5), 40),
    period('w2', utc(2026, 0, 6), utc(2026, 0, 10), 40),
  ];

  it('разделяет проекты с планом и без, сортирует по сумме часов desc', () => {
    const small = project({ id: 'small', plannedEffort: 10 });
    const big = project({ id: 'big', plannedEffort: 100 });
    const noPlan = project({ id: 'noplan', plannedEffort: null });
    const otherDept = project({ id: 'x', departmentId: 'other' });

    const { planned, unplanned } = deptProjectLoads(dept(), [small, big, noPlan, otherDept], periods);

    expect(planned.map((x) => x.project.id)).toEqual(['big', 'small']);
    expect(planned[0].total).toBeGreaterThan(planned[1].total);
    expect(unplanned.map((x) => x.id)).toContain('noplan');
    // проект чужого отдела не попадает ни в planned, ни в unplanned
    expect([...planned.map((x) => x.project.id), ...unplanned.map((x) => x.id)]).not.toContain('x');
  });

  it('план с нулевым попаданием в горизонт уходит в unplanned', () => {
    const future = project({ id: 'fut', startDate: '2027-01-01', endDate: '2027-02-01' });
    const { planned, unplanned } = deptProjectLoads(dept(), [future], periods);
    expect(planned).toHaveLength(0);
    expect(unplanned.map((x) => x.id)).toEqual(['fut']);
  });
});

// DP-0001: бейдж «свободен с {мес}» — первый период с ratio < threshold.
describe('firstFreePeriod', () => {
  const periods = [
    period('p0', utc(2026, 0, 1), utc(2026, 0, 7), 40),
    period('p1', utc(2026, 1, 1), utc(2026, 1, 7), 40),
    period('p2', utc(2026, 2, 1), utc(2026, 2, 7), 40),
  ].map((p, i) => ({ ...p, label: ['янв', 'фев', 'мар'][i] }));

  it('возвращает label первого периода с ratio < threshold (0.9)', () => {
    // 1.2 загружен, 0.95 загружен, 0.8 свободен → «мар»
    const cells = [cell(100, 120), cell(100, 95), cell(100, 80)];
    expect(firstFreePeriod(cells, periods)).toBe('мар');
  });

  it('null, если отдел загружен во всём горизонте', () => {
    const cells = [cell(100, 110), cell(100, 100), cell(100, 95)];
    expect(firstFreePeriod(cells, periods)).toBeNull();
  });

  it('пропускает ratio=null (нулевая ёмкость не считается «свободной»)', () => {
    const cells = [cell(0, 0), cell(100, 50)];
    expect(firstFreePeriod(cells, periods)).toBe('фев');
  });

  it('граница threshold: ratio == threshold не свободен, чуть меньше — свободен', () => {
    expect(firstFreePeriod([cell(100, 90)], periods, 0.9)).toBeNull();
    expect(firstFreePeriod([cell(100, 89)], periods, 0.9)).toBe('янв');
  });

  it('кастомный threshold', () => {
    const cells = [cell(100, 85)];
    expect(firstFreePeriod(cells, periods, 0.8)).toBeNull(); // 0.85 не < 0.8
    expect(firstFreePeriod(cells, periods, 0.9)).toBe('янв'); // 0.85 < 0.9
  });
});

// DP-0001: сводная строка «Все отделы» — сумма ёмкости/загрузки по периодам.
describe('summaryCells', () => {
  const periods = [
    period('p0', utc(2026, 0, 1), utc(2026, 0, 7), 40),
    period('p1', utc(2026, 1, 1), utc(2026, 1, 7), 40),
  ];

  it('суммирует capacity/load по отделам, считает free и ratio', () => {
    const perDept = [
      [cell(100, 50), cell(100, 120)], // отдел A
      [cell(50, 25), cell(50, 10)], // отдел B
    ];
    const [s0, s1] = summaryCells(perDept, periods);
    expect(s0).toMatchObject({ capacity: 150, load: 75, free: 75 });
    expect(s0.ratio).toBeCloseTo(0.5);
    expect(s1).toMatchObject({ capacity: 150, load: 130, free: 20 });
    expect(s1.ratio).toBeCloseTo(130 / 150);
  });

  it('нет отделов → нулевая ёмкость, ratio null', () => {
    const [s0] = summaryCells([], periods);
    expect(s0).toMatchObject({ capacity: 0, load: 0, free: 0, ratio: null });
  });

  it('переносит пропуски ячеек (jagged) как 0', () => {
    const perDept = [[cell(100, 40)], []]; // второй отдел без ячеек
    const [s0] = summaryCells(perDept, [periods[0]]);
    expect(s0).toMatchObject({ capacity: 100, load: 40 });
  });
});

// REQ-0012: раскид плановой загрузки отдела без проекта — та же логика, что у
// проекта (равномерно по дням [start, end], пересечение с периодом).
describe('deptPlanHoursInPeriod', () => {
  const p = period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40); // 5 дней

  it('раскидывает план равномерно по дням и берёт пересечение', () => {
    // план 2026-01-01..01-10 = 10 дней, 100ч → 10ч/день; пересечение 5 дней → 50
    expect(deptPlanHoursInPeriod(deptPlan(), p)).toBe(50);
  });

  it('0 без плана или без дат', () => {
    expect(deptPlanHoursInPeriod(deptPlan({ plannedEffort: null }), p)).toBe(0);
    expect(deptPlanHoursInPeriod(deptPlan({ startDate: null }), p)).toBe(0);
    expect(deptPlanHoursInPeriod(deptPlan({ endDate: null }), p)).toBe(0);
  });

  it('0 при отсутствии пересечения и при end < start', () => {
    const far = period('w', utc(2026, 5, 1), utc(2026, 5, 7), 40);
    expect(deptPlanHoursInPeriod(deptPlan(), far)).toBe(0);
    expect(
      deptPlanHoursInPeriod(deptPlan({ startDate: '2026-01-10', endDate: '2026-01-01' }), p),
    ).toBe(0);
  });

  it('план целиком внутри периода → весь план', () => {
    const wide = period('w', utc(2025, 11, 1), utc(2026, 1, 1), 40);
    expect(deptPlanHoursInPeriod(deptPlan(), wide)).toBe(100);
  });
});

describe('deptLoadCells с deptPlans (REQ-0012)', () => {
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];

  it('суммирует проекты и плановые загрузки отдела', () => {
    // проект 50 + резерв 50 = 100 загрузки за период; ёмкость 160
    const [c] = deptLoadCells(dept(), [project()], periods, [deptPlan()]);
    expect(c.capacity).toBe(160);
    expect(c.load).toBe(100);
    expect(c.ratio).toBeCloseTo(100 / 160);
  });

  it('фильтрует deptPlans по отделу', () => {
    const [c] = deptLoadCells(dept(), [], periods, [
      deptPlan({ id: 'x', departmentId: 'other' }),
    ]);
    expect(c.load).toBe(0);
  });

  it('обратная совместимость: без аргумента deptPlans загрузка только из проектов', () => {
    const [c] = deptLoadCells(dept(), [project()], periods);
    expect(c.load).toBe(50);
  });
});

describe('employeeLoadCells с deptPlans (REQ-0012)', () => {
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];
  const emp: EmployeeRef = { id: 'e1', name: 'Иванов', departmentId: 'd1' };

  it('плановая загрузка отдела делится поровну на численность', () => {
    // резерв 50ч на период, headcount 5 → 10ч на человека; ёмкость 40×0.8=32
    const [c] = employeeLoadCells(emp, dept(), [], periods, [deptPlan()]);
    expect(c.capacity).toBeCloseTo(32);
    expect(c.load).toBeCloseTo(10);
  });
});

describe('deptPlanLoads (REQ-0012)', () => {
  const periods = [
    period('w1', utc(2026, 0, 1), utc(2026, 0, 5), 40),
    period('w2', utc(2026, 0, 6), utc(2026, 0, 10), 40),
  ];

  it('детализирует планы отдела, сортирует по сумме часов desc, фильтрует чужие/нулевые', () => {
    const big = deptPlan({ id: 'big', label: 'Резерв', plannedEffort: 100 });
    const small = deptPlan({ id: 'small', label: 'Прочее', plannedEffort: 10 });
    const other = deptPlan({ id: 'o', departmentId: 'other' });
    const future = deptPlan({ id: 'f', startDate: '2027-01-01', endDate: '2027-02-01' });

    const loads = deptPlanLoads(dept(), [small, big, other, future], periods);
    expect(loads.map((x) => x.plan.id)).toEqual(['big', 'small']);
    expect(loads[0].total).toBeGreaterThan(loads[1].total);
  });
});

// =============================================================================
// W3-1: вычет отсутствий из ёмкости доски.
// Календарь фикстуры: будни 12-25 янв по 8ч. Неделя 2026-01-12..18 = 5 рабочих
// дней (пн-пт 12-16) = 40ч. Отсутствие 12-14 (пн-ср) = 3 дня × 8ч = 24ч.
// =============================================================================

const week1 = period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40);

describe('buildHoursByDay', () => {
  it('строит карту рабочих часов по дням, выходные = 0', () => {
    const m = buildHoursByDay(calendar);
    expect(m.get('2026-01-12')).toBe(8); // пн
    expect(m.get('2026-01-17')).toBe(0); // сб
    expect(m.get('2026-01-18')).toBe(0); // вс
  });
});

describe('absenceHoursInPeriod', () => {
  const hoursByDay = buildHoursByDay(calendar);

  it('Σ рабочих часов дней пересечения отсутствия и периода', () => {
    // 12-14 (пн-ср) внутри недели → 3 × 8 = 24
    expect(absenceHoursInPeriod(absence(), hoursByDay, week1)).toBe(24);
  });

  it('одиночный день: endDate отсутствует → берётся startDate', () => {
    expect(
      absenceHoursInPeriod(absence({ startDate: '2026-01-12', endDate: null }), hoursByDay, week1),
    ).toBe(8);
  });

  it('выходные внутри отсутствия не вычитаются (часы дня = 0)', () => {
    // 16-19 = пт(8) + сб(0) + вс(0) + пн(вне недели) → в week1 попадают пт+сб+вс = 8
    expect(
      absenceHoursInPeriod(absence({ startDate: '2026-01-16', endDate: '2026-01-19' }), hoursByDay, week1),
    ).toBe(8);
  });

  it('0 без startDate и при end < start', () => {
    expect(absenceHoursInPeriod(absence({ startDate: null }), hoursByDay, week1)).toBe(0);
    expect(
      absenceHoursInPeriod(absence({ startDate: '2026-01-14', endDate: '2026-01-12' }), hoursByDay, week1),
    ).toBe(0);
  });

  it('0 при отсутствии пересечения с периодом', () => {
    const far = period('w', utc(2026, 5, 1), utc(2026, 5, 7), 40);
    expect(absenceHoursInPeriod(absence(), hoursByDay, far)).toBe(0);
  });

  it('ISO с временем (DATE_TIME) обрезается до дня', () => {
    expect(
      absenceHoursInPeriod(
        absence({ startDate: '2026-01-12T10:00:00.000Z', endDate: '2026-01-14T10:00:00.000Z' }),
        hoursByDay,
        week1,
      ),
    ).toBe(24);
  });
});

describe('absenceHoursByEmpInPeriod', () => {
  const hoursByDay = buildHoursByDay(calendar);

  it('суммирует часы по employeeId, игнорирует null', () => {
    const m = absenceHoursByEmpInPeriod(
      [absence({ employeeId: 'e1' }), absence({ employeeId: 'e2', startDate: '2026-01-12', endDate: '2026-01-12' }), absence({ employeeId: null })],
      hoursByDay,
      week1,
    );
    expect(m.get('e1')).toBe(24);
    expect(m.get('e2')).toBe(8);
    expect(m.has('null')).toBe(false);
  });

  it('несколько отсутствий одного сотрудника складываются', () => {
    const m = absenceHoursByEmpInPeriod(
      [
        absence({ employeeId: 'e1', startDate: '2026-01-12', endDate: '2026-01-12' }),
        absence({ employeeId: 'e1', startDate: '2026-01-14', endDate: '2026-01-14' }),
      ],
      hoursByDay,
      week1,
    );
    expect(m.get('e1')).toBe(16);
  });
});

describe('deptCapacity с отсутствиями (W3-1)', () => {
  const emps: EmployeeRef[] = [
    { id: 'e1', name: 'Иванов', departmentId: 'd1' },
    { id: 'e2', name: 'Петров', departmentId: 'd1' },
    { id: 'e3', name: 'Чужой', departmentId: 'other' },
  ];

  it('без ctx — прежняя формула (workHours × headcount × factor)', () => {
    expect(deptCapacity(dept(), week1)).toBe(160); // 40 × 5 × 0.8
  });

  it('вычитает часы отсутствий сотрудников отдела', () => {
    const ctx = buildAbsenceCtx([absence({ employeeId: 'e1' })], emps, calendar);
    // 160 − 24 = 136
    expect(deptCapacity(dept(), week1, ctx)).toBe(136);
  });

  it('отсутствие сотрудника чужого отдела не влияет', () => {
    const ctx = buildAbsenceCtx([absence({ employeeId: 'e3' })], emps, calendar);
    expect(deptCapacity(dept(), week1, ctx)).toBe(160);
  });

  it('не опускает ёмкость ниже 0 при переучёте отсутствий', () => {
    const ctx = buildAbsenceCtx(
      [absence({ employeeId: 'e1', startDate: '2026-01-12', endDate: '2026-01-25' })],
      emps,
      calendar,
    );
    // ёмкость маленького отдела (headcount 1, factor 1) меньше часов отсутствия
    const tiny = dept({ headcount: 1, capacityFactor: 1 });
    expect(deptCapacity(tiny, week1, ctx)).toBe(0);
  });
});

describe('deptLoadCells с отсутствиями (W3-1)', () => {
  const periods = [week1];
  const emps: EmployeeRef[] = [
    { id: 'e1', name: 'Иванов', departmentId: 'd1' },
    { id: 'e2', name: 'Петров', departmentId: 'd1' },
  ];

  it('свободно = ёмкость(с вычетом отсутствий) − план', () => {
    const ctx = buildAbsenceCtx([absence({ employeeId: 'e1' })], emps, calendar);
    // проект 2026-01-01..01-10 не пересекает неделю 12-18 → load 0
    // ёмкость 160 − 24 = 136 → free 136
    const [c] = deptLoadCells(dept(), [], periods, [], ctx);
    expect(c.capacity).toBe(136);
    expect(c.load).toBe(0);
    expect(c.free).toBe(136);
    expect(c.ratio).toBe(0);
  });

  it('без ctx — ёмкость без вычета (обратная совместимость UI)', () => {
    const [c] = deptLoadCells(dept(), [], periods, []);
    expect(c.capacity).toBe(160);
  });
});

describe('employeeLoadCells с отсутствиями (W3-1)', () => {
  const periods = [week1];
  const emp: EmployeeRef = { id: 'e1', name: 'Иванов', departmentId: 'd1' };

  it('личная ёмкость уменьшается на отсутствия именно этого сотрудника', () => {
    const ctx = buildAbsenceCtx([absence({ employeeId: 'e1' })], [emp], calendar);
    // базовая личная ёмкость = 40 × 0.8 = 32; вычет 24 → 8
    const [c] = employeeLoadCells(emp, dept(), [], periods, [], ctx);
    expect(c.capacity).toBe(8);
  });

  it('отсутствие другого сотрудника не влияет на личную ёмкость', () => {
    const other: EmployeeRef = { id: 'e2', name: 'Петров', departmentId: 'd1' };
    const ctx = buildAbsenceCtx([absence({ employeeId: 'e2' })], [emp, other], calendar);
    const [c] = employeeLoadCells(emp, dept(), [], periods, [], ctx);
    expect(c.capacity).toBe(32);
  });

  it('личная ёмкость не ниже 0', () => {
    const ctx = buildAbsenceCtx(
      [absence({ employeeId: 'e1', startDate: '2026-01-12', endDate: '2026-01-25' })],
      [emp],
      calendar,
    );
    const [c] = employeeLoadCells(emp, dept(), [], periods, [], ctx);
    expect(c.capacity).toBe(0);
  });
});

// ===========================================================================
// REQ-0013 13b: загрузка по долям отделов (credosTimeProjectDepartment).
// ===========================================================================
describe('доли отделов в проектах (REQ-0013 13b)', () => {
  // Период целиком накрывает проект 2026-01-01..01-10 → раскид = весь эффорт.
  const wk = period('w', utc(2026, 0, 1), utc(2026, 0, 31), 160);
  // Проект на 100ч, период проекта 2026-01-01..01-10.
  const proj = (over: Partial<CapProject> = {}): CapProject =>
    project({ id: 'pA', plannedEffort: 100, startDate: '2026-01-01', endDate: '2026-01-10', ...over });
  const share = (over: Partial<ProjectDeptShare> = {}): ProjectDeptShare => ({
    projectId: 'pA',
    departmentId: 'd1',
    plannedEffortShare: 100,
    ...over,
  });

  it('projectShareHoursInPeriod раскидывает долю по датам проекта', () => {
    // доля 60ч, период проекта 10 дней, колонка накрывает весь проект → 60ч
    const h = projectShareHoursInPeriod(proj(), share({ plannedEffortShare: 60 }), wk);
    expect(h).toBeCloseTo(60, 6);
  });

  it('buildSharesByProject группирует по projectId, отбрасывает без projectId', () => {
    const m = buildSharesByProject([
      share({ departmentId: 'd1' }),
      share({ departmentId: 'd2' }),
      share({ projectId: null }),
    ]);
    expect(m.get('pA')).toHaveLength(2);
    expect(m.size).toBe(1);
  });

  it('загрузка отдела = его доля (не весь plannedEffort)', () => {
    const projects = [proj()];
    const sbp = buildSharesByProject([
      share({ departmentId: 'd1', plannedEffortShare: 60 }),
      share({ departmentId: 'd2', plannedEffortShare: 40 }),
    ]);
    const d1 = dept({ id: 'd1' });
    const [c] = deptLoadCells(d1, projects, [wk], [], undefined, sbp);
    expect(c.load).toBeCloseTo(60, 6); // только доля d1, не 100
  });

  it('проект на 2 отдела: Σ загрузок отделов = plannedEffort', () => {
    const projects = [proj()];
    const sbp = buildSharesByProject([
      share({ departmentId: 'd1', plannedEffortShare: 60 }),
      share({ departmentId: 'd2', plannedEffortShare: 40 }),
    ]);
    const [c1] = deptLoadCells(dept({ id: 'd1' }), projects, [wk], [], undefined, sbp);
    const [c2] = deptLoadCells(dept({ id: 'd2' }), projects, [wk], [], undefined, sbp);
    expect(c1.load + c2.load).toBeCloseTo(100, 6); // = plannedEffort
  });

  it('fallback: у проекта НЕТ долей → старое поведение (весь plannedEffort на departmentId)', () => {
    const projects = [proj({ departmentId: 'd1' })];
    const emptySbp = buildSharesByProject([]);
    const [c1] = deptLoadCells(dept({ id: 'd1' }), projects, [wk], [], undefined, emptySbp);
    expect(c1.load).toBeCloseTo(100, 6); // весь plannedEffort
    const [c2] = deptLoadCells(dept({ id: 'd2' }), projects, [wk], [], undefined, emptySbp);
    expect(c2.load).toBe(0); // чужой отдел — 0
  });

  it('fallback при undefined sharesByProject (обратная совместимость вызовов UI)', () => {
    const projects = [proj({ departmentId: 'd1' })];
    const [c1] = deptLoadCells(dept({ id: 'd1' }), projects, [wk]);
    expect(c1.load).toBeCloseTo(100, 6);
  });

  it('employeeLoadCells: доля отдела делится поровну по людям', () => {
    const projects = [proj()];
    const sbp = buildSharesByProject([share({ departmentId: 'd1', plannedEffortShare: 60 })]);
    const emp: EmployeeRef = { id: 'e1', name: 'И', departmentId: 'd1' };
    // headcount=5 → доля сотрудника = 60/5 = 12
    const [c] = employeeLoadCells(emp, dept({ id: 'd1', headcount: 5 }), projects, [wk], [], undefined, sbp);
    expect(c.load).toBeCloseTo(12, 6);
  });

  it('deptProjectLoads: вклад проекта = часы доли отдела', () => {
    const projects = [proj()];
    const sbp = buildSharesByProject([
      share({ departmentId: 'd1', plannedEffortShare: 60 }),
      share({ departmentId: 'd2', plannedEffortShare: 40 }),
    ]);
    const { planned } = deptProjectLoads(dept({ id: 'd1' }), projects, [wk], sbp);
    expect(planned).toHaveLength(1);
    expect(planned[0].total).toBeCloseTo(60, 6);
    // отдел d2 видит свою долю
    const { planned: p2 } = deptProjectLoads(dept({ id: 'd2' }), projects, [wk], sbp);
    expect(p2[0].total).toBeCloseTo(40, 6);
  });

  it('deptProjectLoads fallback: проект без долей виден только родному отделу', () => {
    const projects = [proj({ departmentId: 'd1' })];
    const { planned } = deptProjectLoads(dept({ id: 'd1' }), projects, [wk]);
    expect(planned[0].total).toBeCloseTo(100, 6);
    const { planned: p2 } = deptProjectLoads(dept({ id: 'd2' }), projects, [wk]);
    expect(p2).toHaveLength(0);
  });

  // Drill 3-й уровень: проект → доли по всем участвующим отделам.
  it('projectDeptShareLoads: доли проекта по отделам, сорт по убыв. часов', () => {
    const sbp = buildSharesByProject([
      share({ departmentId: 'd1', plannedEffortShare: 60 }),
      share({ departmentId: 'd2', plannedEffortShare: 40 }),
    ]);
    const out = projectDeptShareLoads(proj(), [wk], sbp);
    expect(out).toHaveLength(2);
    expect(out[0].departmentId).toBe('d1'); // 60 раньше 40
    expect(out[0].total).toBeCloseTo(60, 6);
    expect(out[1].total).toBeCloseTo(40, 6);
  });

  it('projectDeptShareLoads: у проекта без долей → пусто (нечего детализировать)', () => {
    expect(projectDeptShareLoads(proj(), [wk], buildSharesByProject([]))).toHaveLength(0);
    expect(projectDeptShareLoads(proj(), [wk])).toHaveLength(0);
  });
});

// =============================================================================
// REQ-0011: isAssignmentActive + fteHeadcountByDept
// =============================================================================

const asgn = (over: Partial<EmpDeptAssignment> = {}): EmpDeptAssignment => ({
  employeeId: 'e1',
  departmentId: 'd1',
  ftePercent: 100,
  startDate: null,
  endDate: null,
  ...over,
});
const empRef = (over: Partial<EmployeeRef> = {}): EmployeeRef => ({
  id: 'e1', name: 'Иванов', departmentId: 'd1', ...over,
});

describe('isAssignmentActive', () => {
  it('null startDate + null endDate → всегда активно', () => {
    expect(isAssignmentActive(asgn({ startDate: null, endDate: null }), '2026-01-01', '2026-01-31')).toBe(true);
  });

  it('startDate после to → неактивно', () => {
    expect(isAssignmentActive(asgn({ startDate: '2026-02-01' }), '2026-01-01', '2026-01-31')).toBe(false);
  });

  it('endDate до from → неактивно', () => {
    expect(isAssignmentActive(asgn({ endDate: '2025-12-31' }), '2026-01-01', '2026-01-31')).toBe(false);
  });

  it('startDate == to (граница) → активно', () => {
    expect(isAssignmentActive(asgn({ startDate: '2026-01-31' }), '2026-01-01', '2026-01-31')).toBe(true);
  });

  it('endDate == from (граница) → активно', () => {
    expect(isAssignmentActive(asgn({ endDate: '2026-01-01' }), '2026-01-01', '2026-01-31')).toBe(true);
  });

  it('активный диапазон внутри запроса', () => {
    expect(isAssignmentActive(
      asgn({ startDate: '2026-01-10', endDate: '2026-01-20' }),
      '2026-01-01', '2026-01-31',
    )).toBe(true);
  });
});

describe('fteHeadcountByDept', () => {
  it('100% FTE → 1.0 в отделе', () => {
    const result = fteHeadcountByDept([asgn()], [], '2026-01-01', '2026-01-31');
    expect(result.get('d1')).toBeCloseTo(1.0);
  });

  it('50% FTE → 0.5 в отделе', () => {
    const result = fteHeadcountByDept([asgn({ ftePercent: 50 })], [], '2026-01-01', '2026-01-31');
    expect(result.get('d1')).toBeCloseTo(0.5);
  });

  it('два сотрудника по 50% в одном отделе → 1.0', () => {
    const result = fteHeadcountByDept([
      asgn({ employeeId: 'e1', ftePercent: 50 }),
      asgn({ employeeId: 'e2', ftePercent: 50 }),
    ], [], '2026-01-01', '2026-01-31');
    expect(result.get('d1')).toBeCloseTo(1.0);
  });

  it('истёкшее назначение → не учитывается', () => {
    const result = fteHeadcountByDept(
      [asgn({ endDate: '2025-12-31' })], [], '2026-01-01', '2026-01-31',
    );
    expect(result.get('d1')).toBeUndefined();
  });

  it('fallback: без записей → 1.0 по departmentId сотрудника', () => {
    const result = fteHeadcountByDept([], [empRef()], '2026-01-01', '2026-01-31');
    expect(result.get('d1')).toBeCloseTo(1.0);
  });

  it('fallback не применяется если у сотрудника есть запись (даже истёкшая)', () => {
    const result = fteHeadcountByDept(
      [asgn({ endDate: '2025-12-31' })],
      [empRef()],
      '2026-01-01', '2026-01-31',
    );
    expect(result.get('d1')).toBeUndefined();
  });

  it('ftePercent=null → трактуется как 100% (1.0)', () => {
    const result = fteHeadcountByDept([asgn({ ftePercent: null })], [], '2026-01-01', '2026-01-31');
    expect(result.get('d1')).toBeCloseTo(1.0);
  });
});

// ─── plannedHoursInPeriod (REQ-0004 Часть C) ─────────────────────────────────

const mkPeriod = (from: string, to: string): Period => ({
  key: `${from}/${to}`,
  label: from,
  from: new Date(from),
  to: new Date(to),
  workHours: 40,
});

const mkBooking = (over: Partial<Booking> = {}): Booking => ({
  id: '00000000-0000-4000-8000-000000000001',
  employeeId: 'e1',
  projectId: 'p1',
  bookingType: 'HARD',
  hours: 80,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  ...over,
});

describe('plannedHoursInPeriod', () => {
  it('период совпадает с бронью → 100% часов', () => {
    // Jun 1..Jun 30 = 30 дней, overlap = 30 → все 80 ч
    const period = mkPeriod('2026-06-01', '2026-06-30');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-30', period)).toBeCloseTo(80);
  });

  it('частичное перекрытие → пропорционально', () => {
    // бронь Jun 1..Jun 30 (30 дн), период Jun 1..Jun 15 (15 дн) → 80 * 15/30 = 40
    const period = mkPeriod('2026-06-01', '2026-06-15');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-30', period)).toBeCloseTo(40);
  });

  it('нет пересечения → 0', () => {
    const period = mkPeriod('2026-07-01', '2026-07-31');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-30', period)).toBe(0);
  });

  it('null plannedEffort → 0', () => {
    expect(plannedHoursInPeriod(null, '2026-06-01', '2026-06-30', mkPeriod('2026-06-01', '2026-06-30'))).toBe(0);
  });

  it('null startDate → 0', () => {
    expect(plannedHoursInPeriod(80, null, '2026-06-30', mkPeriod('2026-06-01', '2026-06-30'))).toBe(0);
  });

  it('endDate < startDate → 0', () => {
    expect(plannedHoursInPeriod(80, '2026-06-30', '2026-06-01', mkPeriod('2026-06-01', '2026-06-30'))).toBe(0);
  });
});

describe('bookingHoursInPeriod', () => {
  it('делегирует к plannedHoursInPeriod (HARD/полный период)', () => {
    const b = mkBooking({ hours: 80, startDate: '2026-06-01', endDate: '2026-06-30' });
    const period = mkPeriod('2026-06-01', '2026-06-30');
    expect(bookingHoursInPeriod(b, period)).toBeCloseTo(80);
  });

  it('SOFT-бронь считается так же (тип не влияет на часы)', () => {
    const b = mkBooking({ bookingType: 'SOFT', hours: 40 });
    const period = mkPeriod('2026-06-01', '2026-06-30');
    expect(bookingHoursInPeriod(b, period)).toBeCloseTo(40);
  });

  it('нет пересечения → 0', () => {
    const b = mkBooking({ startDate: '2026-05-01', endDate: '2026-05-31' });
    expect(bookingHoursInPeriod(b, mkPeriod('2026-06-01', '2026-06-30'))).toBe(0);
  });
});

const bookEmp = (id: string, departmentId: string | null = 'd1'): EmployeeRef => ({
  id,
  departmentId,
  name: 'Test',
});

describe('buildBookingCtx', () => {
  const emp = bookEmp;

  it('группирует брони по employeeId', () => {
    const b1 = mkBooking({ id: 'b1', employeeId: 'e1' });
    const b2 = mkBooking({ id: 'b2', employeeId: 'e1' });
    const b3 = mkBooking({ id: 'b3', employeeId: 'e2' });
    const ctx = buildBookingCtx([b1, b2, b3], [emp('e1'), emp('e2')], true);
    expect(ctx.byEmployee.get('e1')).toHaveLength(2);
    expect(ctx.byEmployee.get('e2')).toHaveLength(1);
  });

  it('бронь без employeeId пропускается', () => {
    const b = mkBooking({ employeeId: null });
    const ctx = buildBookingCtx([b], [], false);
    expect(ctx.byEmployee.size).toBe(0);
  });

  it('includeSoft сохраняется в ctx', () => {
    expect(buildBookingCtx([], [], true).includeSoft).toBe(true);
    expect(buildBookingCtx([], [], false).includeSoft).toBe(false);
  });

  it('пустой массив броней → пустая Map', () => {
    const ctx = buildBookingCtx([], [emp('e1')], true);
    expect(ctx.byEmployee.size).toBe(0);
  });
});

// ─── REQ-0004 C: бронь как слой Demand в deptLoadCells/employeeLoadCells ──────
describe('deptLoadCells с бронями (REQ-0004 C)', () => {
  // Период 5 дней; ёмкость отдела (headcount 5 × 40ч × 0.8) — пересчитывается из
  // workHours. Берём период с workHours=40 → capacity = 40*5*0.8 = 160.
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];
  // Бронь целиком внутри периода → все hours в этой колонке.
  const book = (over: Partial<Booking> = {}): Booking =>
    mkBooking({ startDate: '2026-01-01', endDate: '2026-01-05', ...over });

  it('HARD-бронь суммируется в load (потребляет ёмкость)', () => {
    const ctx = buildBookingCtx([book({ hours: 50, bookingType: 'HARD' })], [bookEmp('e1')], true);
    const [c] = deptLoadCells(dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.load).toBeCloseTo(50);
    expect(c.hardBooking).toBeCloseTo(50);
    expect(c.softBooking).toBe(0);
    expect(c.free).toBeCloseTo(160 - 50);
  });

  it('SOFT-бронь НЕ суммируется в load, но видна softBooking при includeSoft', () => {
    const ctx = buildBookingCtx([book({ hours: 50, bookingType: 'SOFT' })], [bookEmp('e1')], true);
    const [c] = deptLoadCells(dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.load).toBe(0);
    expect(c.hardBooking).toBe(0);
    expect(c.softBooking).toBeCloseTo(50);
  });

  it('SOFT скрыт когда includeSoft=false (softBooking=0)', () => {
    const ctx = buildBookingCtx([book({ hours: 50, bookingType: 'SOFT' })], [bookEmp('e1')], false);
    const [c] = deptLoadCells(dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.softBooking).toBe(0);
    expect(c.load).toBe(0);
  });

  it('HARD-бронь + план суммируются; конфликт при Demand>ёмкости', () => {
    // план проекта 100 на 10 дн → 50 в 5-дневном периоде; + HARD 150 → 200 > 160.
    const ctx = buildBookingCtx([book({ hours: 150, bookingType: 'HARD' })], [bookEmp('e1')], true);
    const [c] = deptLoadCells(dept(), [project()], periods, [], undefined, undefined, ctx);
    expect(c.load).toBeCloseTo(200);
    expect(c.conflict).toBe(true);
  });

  it('нет конфликта когда Demand ≤ ёмкости', () => {
    const ctx = buildBookingCtx([book({ hours: 40, bookingType: 'HARD' })], [bookEmp('e1')], true);
    const [c] = deptLoadCells(dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.conflict).toBe(false);
  });

  it('бронь сотрудника другого отдела не учитывается', () => {
    const ctx = buildBookingCtx([book({ hours: 50 })], [bookEmp('e1', 'OTHER')], true);
    const [c] = deptLoadCells(dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.hardBooking).toBe(0);
  });

  it('без bookingCtx — прежнее поведение (поля брони = 0/false)', () => {
    const [c] = deptLoadCells(dept(), [], periods);
    expect(c.hardBooking).toBe(0);
    expect(c.softBooking).toBe(0);
    expect(c.conflict).toBe(false);
  });
});

describe('employeeLoadCells с бронями (REQ-0004 C)', () => {
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];
  // Личная ёмкость = workHours(40) × factor(0.8) = 32.
  const book = (over: Partial<Booking> = {}): Booking =>
    mkBooking({ startDate: '2026-01-01', endDate: '2026-01-05', ...over });

  it('HARD-бронь сотрудника входит в load (не делится на численность)', () => {
    const ctx = buildBookingCtx([book({ hours: 20, bookingType: 'HARD' })], [bookEmp('e1')], true);
    const [c] = employeeLoadCells(bookEmp('e1'), dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.hardBooking).toBeCloseTo(20);
    expect(c.load).toBeCloseTo(20);
  });

  it('HARD-бронь > личной ёмкости → конфликт', () => {
    const ctx = buildBookingCtx([book({ hours: 50, bookingType: 'HARD' })], [bookEmp('e1')], true);
    const [c] = employeeLoadCells(bookEmp('e1'), dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.load).toBeCloseTo(50);
    expect(c.conflict).toBe(true); // 50 > 32
  });

  it('SOFT не потребляет ёмкость сотрудника', () => {
    const ctx = buildBookingCtx([book({ hours: 50, bookingType: 'SOFT' })], [bookEmp('e1')], true);
    const [c] = employeeLoadCells(bookEmp('e1'), dept(), [], periods, [], undefined, undefined, ctx);
    expect(c.load).toBe(0);
    expect(c.softBooking).toBeCloseTo(50);
    expect(c.conflict).toBe(false);
  });
});

describe('summaryCells с бронями (REQ-0004 C)', () => {
  it('суммирует hardBooking/softBooking; conflict по сумме Demand vs ёмкости', () => {
    // cap 100+50=150, load 90+80=170 > 150 → conflict.
    const a: LoadCell = { capacity: 100, load: 90, free: 10, ratio: 0.9, hardBooking: 30, softBooking: 10, conflict: false };
    const b: LoadCell = { capacity: 50, load: 80, free: -30, ratio: 1.6, hardBooking: 20, softBooking: 5, conflict: true };
    const [s] = summaryCells([[a], [b]], [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)]);
    expect(s.hardBooking).toBe(50);
    expect(s.softBooking).toBe(15);
    expect(s.load).toBe(170);
    expect(s.conflict).toBe(true); // 170 > 150
  });

  it('conflict=false когда суммарный Demand ≤ суммарной ёмкости', () => {
    const a: LoadCell = { capacity: 100, load: 80, free: 20, ratio: 0.8, hardBooking: 0, softBooking: 0, conflict: false };
    const [s] = summaryCells([[a]], [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)]);
    expect(s.conflict).toBe(false);
  });
});

// ─── WI-05: раскид плана по РАБОЧИМ дням производственного календаря ───────────
// Делитель/числитель = Σ рабочих часов (а не календарные дни). План «капает»
// только на будни → бьётся с ёмкостью. Сверка с Timetta: «равномерно = по
// РАБОЧИМ дням расписания». Контекст PlanSpread опционален: без него — прежнее
// календарное поведение (back-compat, проверяется существующими тестами выше).
describe('plannedHoursInPeriod — раскид по рабочим дням (WI-05)', () => {
  // Календарь: пн-пт 8ч, сб/вс отсутствуют (=0). 2026-06-01 — понедельник.
  // Неделя 1: 01-05 (5 раб. дней), вых 06-07; неделя 2: 08-12 (5 раб. дней).
  const cal: CalendarDay[] = [];
  for (let d = 1; d <= 12; d++) {
    const date = new Date(Date.UTC(2026, 5, d));
    const dow = date.getUTCDay(); // 0=вс,6=сб
    if (dow === 0 || dow === 6) continue; // выходные не в календаре
    cal.push({ date: date.toISOString().slice(0, 10), hours: 8 });
  }
  const hoursByDay = buildHoursByDay(cal);
  const spread = { hoursByDay };

  it('делит 80ч по 10 рабочим дням (2 недели) → 40ч на каждую рабочую неделю', () => {
    // план 01-12 (вкл вых): рабочих 10 дней × 8ч = 80 раб.ч; неделя 1 overlap = 5×8=40ч.
    const wk1 = mkPeriod('2026-06-01', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', wk1, spread)).toBeCloseTo(40);
    const wk2 = mkPeriod('2026-06-08', '2026-06-14');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', wk2, spread)).toBeCloseTo(40);
  });

  it('инвариант Σ по периодам = plannedEffort', () => {
    const wk1 = mkPeriod('2026-06-01', '2026-06-07');
    const wk2 = mkPeriod('2026-06-08', '2026-06-14');
    const sum =
      plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', wk1, spread) +
      plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', wk2, spread);
    expect(sum).toBeCloseTo(80);
  });

  it('колонка целиком в выходных → 0 (план не капает в субботу/воскресенье)', () => {
    // период = только сб-вс 06-07; в календаре их нет → рабочий overlap 0 → 0ч.
    const weekend = mkPeriod('2026-06-06', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', weekend, spread)).toBe(0);
  });

  it('праздник/короткий день учтены: короткий день даёт меньше часов', () => {
    // Календарь: пн 8, вт 4 (короткий), ср 8 = 20 раб.ч на 3 дня. План 20ч.
    const shortCal: CalendarDay[] = [
      { date: '2026-06-01', hours: 8 },
      { date: '2026-06-02', hours: 4 }, // короткий день
      { date: '2026-06-03', hours: 8 },
    ];
    const sp = { hoursByDay: buildHoursByDay(shortCal) };
    // колонка = только вторник (короткий) → 20 × 4/20 = 4ч.
    const tue = mkPeriod('2026-06-02', '2026-06-02');
    expect(plannedHoursInPeriod(20, '2026-06-01', '2026-06-03', tue, sp)).toBeCloseTo(4);
    // колонка = пн+ср → 20 × 16/20 = 16ч.
    const monWed = mkPeriod('2026-06-01', '2026-06-03');
    const wed = mkPeriod('2026-06-03', '2026-06-03');
    expect(plannedHoursInPeriod(20, '2026-06-01', '2026-06-03', wed, sp)).toBeCloseTo(8);
    expect(plannedHoursInPeriod(20, '2026-06-01', '2026-06-03', monWed, sp)).toBeCloseTo(20);
  });

  it('нет рабочих дней в диапазоне плана → 0 (защита от деления-на-0)', () => {
    // диапазон плана целиком в выходных (нет в календаре) → totalWork=0 → 0.
    const sat = mkPeriod('2026-06-06', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-06', '2026-06-07', sat, spread)).toBe(0);
  });

  it('граница периода: частичное пересечение по рабочим часам', () => {
    // план 01-12 (80 раб.ч), колонка 04-09: рабочие дни 04,05 (нед1) + 08,09 (нед2)
    // = 4×8 = 32 раб.ч → 80 × 32/80 = 32ч.
    const mid = mkPeriod('2026-06-04', '2026-06-09');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', mid, spread)).toBeCloseTo(32);
  });

  it('проект без endDate → раскид до horizonEnd (иначе план невидим)', () => {
    // без endDate, horizonEnd=12: тянем 01..12 → как полный диапазон (80 раб.ч).
    const sp = { hoursByDay, horizonEnd: '2026-06-12' };
    const wk1 = mkPeriod('2026-06-01', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-01', null, wk1, sp)).toBeCloseTo(40);
  });

  it('проект без endDate и без horizonEnd → 0 (прежнее поведение)', () => {
    const wk1 = mkPeriod('2026-06-01', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-01', null, wk1, spread)).toBe(0);
  });

  it('без spread — прежний календарный раскид (back-compat)', () => {
    // 12 календарных дней, колонка 01-07 = 7 дней → 80 × 7/12 ≈ 46.67 (НЕ 40).
    const wk1 = mkPeriod('2026-06-01', '2026-06-07');
    expect(plannedHoursInPeriod(80, '2026-06-01', '2026-06-12', wk1)).toBeCloseTo((80 * 7) / 12);
  });
});

describe('обёртки раскида принимают PlanSpread (WI-05)', () => {
  const cal: CalendarDay[] = [
    { date: '2026-06-01', hours: 8 },
    { date: '2026-06-02', hours: 8 },
    { date: '2026-06-03', hours: 8 },
    { date: '2026-06-04', hours: 8 },
    { date: '2026-06-05', hours: 8 },
    { date: '2026-06-08', hours: 8 },
    { date: '2026-06-09', hours: 8 },
    { date: '2026-06-10', hours: 8 },
    { date: '2026-06-11', hours: 8 },
    { date: '2026-06-12', hours: 8 },
  ];
  const spread = { hoursByDay: buildHoursByDay(cal) };
  const wk1 = mkPeriod('2026-06-01', '2026-06-07');

  const proj = (over: Partial<CapProject> = {}): CapProject => ({
    id: 'p1',
    code: 'P1',
    name: 'Проект',
    departmentId: 'd1',
    plannedEffort: 80,
    startDate: '2026-06-01',
    endDate: '2026-06-12',
    ...over,
  });

  it('projectHoursInPeriod по рабочим дням → 40 (неделя 1)', () => {
    expect(projectHoursInPeriod(proj(), wk1, spread)).toBeCloseTo(40);
  });

  it('deptPlanHoursInPeriod по рабочим дням → 40', () => {
    const plan: DeptPlan = {
      id: 'dp1',
      label: 'Резерв',
      departmentId: 'd1',
      category: null,
      plannedEffort: 80,
      startDate: '2026-06-01',
      endDate: '2026-06-12',
    };
    expect(deptPlanHoursInPeriod(plan, wk1, spread)).toBeCloseTo(40);
  });

  it('bookingHoursInPeriod по рабочим дням → 40', () => {
    const b = mkBooking({ hours: 80, startDate: '2026-06-01', endDate: '2026-06-12' });
    expect(bookingHoursInPeriod(b, wk1, spread)).toBeCloseTo(40);
  });

  it('projectShareHoursInPeriod по рабочим дням → 20 (доля 40ч)', () => {
    const share: ProjectDeptShare = { projectId: 'p1', departmentId: 'd1', plannedEffortShare: 40 };
    expect(projectShareHoursInPeriod(proj(), share, wk1, spread)).toBeCloseTo(20);
  });

  it('deptLoadCells пробрасывает spread в загрузку отдела', () => {
    const periods = [wk1];
    const [c] = deptLoadCells(dept(), [proj()], periods, [], undefined, undefined, undefined, spread);
    expect(c.load).toBeCloseTo(40); // по рабочим дням, не 80×7/12
  });

  it('deptProjectLoads: проект без endDate виден при horizonEnd', () => {
    const sp = { hoursByDay: spread.hoursByDay, horizonEnd: '2026-06-12' };
    const periods = [wk1, mkPeriod('2026-06-08', '2026-06-14')];
    const { planned, unplanned } = deptProjectLoads(
      dept(),
      [proj({ endDate: null })],
      periods,
      undefined,
      sp,
    );
    expect(unplanned).toHaveLength(0);
    expect(planned).toHaveLength(1);
    expect(planned[0].total).toBeCloseTo(80);
  });

  it('deptProjectLoads: проект без endDate и без horizonEnd → в unplanned', () => {
    const periods = [wk1];
    const { planned, unplanned } = deptProjectLoads(dept(), [proj({ endDate: null })], periods, undefined, spread);
    expect(planned).toHaveLength(0);
    expect(unplanned.map((p) => p.id)).toEqual(['p1']);
  });
});

describe('buildSharesByProject', () => {
  const share = (projectId: string | null, departmentId: string, h: number): ProjectDeptShare => ({
    projectId,
    departmentId,
    plannedEffortShare: h,
  });

  it('пустой вход → пустая Map', () => {
    expect(buildSharesByProject([])).toEqual(new Map());
  });

  it('группирует доли по projectId', () => {
    const result = buildSharesByProject([
      share('p1', 'd1', 40),
      share('p1', 'd2', 60),
      share('p2', 'd1', 80),
    ]);
    expect(result.get('p1')).toHaveLength(2);
    expect(result.get('p2')).toHaveLength(1);
  });

  it('запись без projectId (null) игнорируется', () => {
    const result = buildSharesByProject([share(null, 'd1', 100)]);
    expect(result.size).toBe(0);
  });

  it('порядок долей сохраняется', () => {
    const result = buildSharesByProject([
      share('p1', 'd1', 40),
      share('p1', 'd2', 60),
    ]);
    expect(result.get('p1')!.map((s) => s.departmentId)).toEqual(['d1', 'd2']);
  });
});

describe('projectDeptHoursInPeriod', () => {
  const p = mkPeriod('2026-06-01', '2026-06-30');
  const proj60: CapProject = {
    id: 'p1',
    code: 'P1',
    name: 'Проект',
    departmentId: 'd1',
    plannedEffort: 60,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  };

  it('нет sharesByProject → fallback: родной отдел получает весь plannedEffort', () => {
    expect(projectDeptHoursInPeriod(proj60, 'd1', p)).toBeCloseTo(60);
  });

  it('нет sharesByProject, чужой отдел → 0', () => {
    expect(projectDeptHoursInPeriod(proj60, 'd2', p)).toBe(0);
  });

  it('sharesByProject есть → Σ долей только этого отдела', () => {
    const shares: ProjectDeptShare[] = [
      { projectId: 'p1', departmentId: 'd1', plannedEffortShare: 20 },
      { projectId: 'p1', departmentId: 'd2', plannedEffortShare: 40 },
    ];
    const sbp = buildSharesByProject(shares);
    expect(projectDeptHoursInPeriod(proj60, 'd1', p, sbp)).toBeCloseTo(20);
    expect(projectDeptHoursInPeriod(proj60, 'd2', p, sbp)).toBeCloseTo(40);
  });

  it('у проекта нет долей в sharesByProject → fallback на родной отдел', () => {
    const sbp = buildSharesByProject([]); // p1 не в Map
    expect(projectDeptHoursInPeriod(proj60, 'd1', p, sbp)).toBeCloseTo(60);
  });
});

describe('deptBookingHours', () => {
  const emp1: EmployeeRef = { id: 'e1', name: 'Иванов', departmentId: 'd1' };
  const emp2: EmployeeRef = { id: 'e2', name: 'Петров', departmentId: 'd1' };
  const emp3: EmployeeRef = { id: 'e3', name: 'Сидоров', departmentId: 'd2' };
  const p = mkPeriod('2026-06-01', '2026-06-30');

  it('нет ctx (undefined) → hard=0, soft=0', () => {
    expect(deptBookingHours(dept(), undefined, p)).toEqual({ hard: 0, soft: 0 });
  });

  it('HARD-бронь сотрудника отдела → hard > 0', () => {
    const ctx = buildBookingCtx(
      [mkBooking({ employeeId: 'e1', bookingType: 'HARD', hours: 80 })],
      [emp1],
      true,
    );
    const result = deptBookingHours(dept(), ctx, p);
    expect(result.hard).toBeCloseTo(80);
    expect(result.soft).toBe(0);
  });

  it('SOFT-бронь → soft > 0, hard = 0', () => {
    const ctx = buildBookingCtx(
      [mkBooking({ employeeId: 'e1', bookingType: 'SOFT', hours: 40 })],
      [emp1],
      true,
    );
    const result = deptBookingHours(dept(), ctx, p);
    expect(result.soft).toBeCloseTo(40);
    expect(result.hard).toBe(0);
  });

  it('суммирует брони нескольких сотрудников отдела', () => {
    const ctx = buildBookingCtx(
      [
        mkBooking({ employeeId: 'e1', bookingType: 'HARD', hours: 40 }),
        mkBooking({ employeeId: 'e2', bookingType: 'HARD', hours: 40 }),
      ],
      [emp1, emp2],
      true,
    );
    const result = deptBookingHours(dept(), ctx, p);
    expect(result.hard).toBeCloseTo(80);
  });

  it('сотрудник из другого отдела (d2) не учитывается в d1', () => {
    const ctx = buildBookingCtx(
      [mkBooking({ employeeId: 'e3', bookingType: 'HARD', hours: 80 })],
      [emp3],
      true,
    );
    expect(deptBookingHours(dept(), ctx, p)).toEqual({ hard: 0, soft: 0 });
  });
});

// ===========================================================================
// WI-47: ручной раскид по месяцам (planMethod=MANUAL, credosTimePlanSlot).
// ===========================================================================

describe('monthRange (WI-47)', () => {
  it('возвращает первый и последний день месяца', () => {
    expect(monthRange('2026-01')).toEqual({ start: '2026-01-01', end: '2026-01-31' });
    expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' }); // не високосный
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' }); // високосный
  });

  it('null на невалидном ключе', () => {
    expect(monthRange('')).toBeNull();
    expect(monthRange(null)).toBeNull();
    expect(monthRange('2026-13')).toBeNull();
    expect(monthRange('2026-00')).toBeNull();
    expect(monthRange('2026-1')).toBeNull();
    expect(monthRange('abc')).toBeNull();
  });
});

describe('buildSlotsByProject (WI-47, дедуп-группировка)', () => {
  const slot = (over: Partial<PlanSlot> = {}): PlanSlot => ({
    projectId: 'p1',
    departmentId: null,
    periodMonth: '2026-01',
    plannedHours: 100,
    ...over,
  });

  it('группирует по projectId', () => {
    const map = buildSlotsByProject([
      slot({ periodMonth: '2026-01' }),
      slot({ periodMonth: '2026-02' }),
      slot({ projectId: 'p2', periodMonth: '2026-01' }),
    ]);
    expect(map.get('p1')).toHaveLength(2);
    expect(map.get('p2')).toHaveLength(1);
  });

  it('отбрасывает слоты без projectId / без валидного месяца', () => {
    const map = buildSlotsByProject([
      slot({ projectId: null }),
      slot({ periodMonth: 'bad' }),
      slot({ periodMonth: '2026-03' }),
    ]);
    expect(map.get('p1')).toHaveLength(1);
  });
});

describe('slotsHoursInPeriod (WI-47, раскид внутри месяца по рабочим дням)', () => {
  const hoursByDay = buildHoursByDay(calendar); // будни 12..25 янв по 8ч
  const spread = { hoursByDay };

  it('месячный слот раскидан по рабочим дням, пересечение с колонкой-неделей', () => {
    // январь 2026: рабочих дней (по календарю-фикстуре 12..25) = 10 дней × 8ч = 80ч.
    // слот 80ч на 2026-01 → 1ч/рабочий час. Неделя 12..18: рабочих 5×8=40ч → 40ч.
    const slots: PlanSlot[] = [
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 80 },
    ];
    const week = period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40);
    expect(slotsHoursInPeriod(slots, week, spread)).toBeCloseTo(40);
  });

  it('Σ слота по обеим неделям = весь plannedHours месяца (инвариант)', () => {
    const slots: PlanSlot[] = [
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 80 },
    ];
    const w1 = period('w1', utc(2026, 0, 12), utc(2026, 0, 18), 40);
    const w2 = period('w2', utc(2026, 0, 19), utc(2026, 0, 25), 40);
    const total = slotsHoursInPeriod(slots, w1, spread) + slotsHoursInPeriod(slots, w2, spread);
    expect(total).toBeCloseTo(80);
  });

  it('пустой/0 слот вклада не даёт; пустой набор → 0', () => {
    const week = period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40);
    expect(
      slotsHoursInPeriod(
        [{ projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 0 }],
        week,
        spread,
      ),
    ).toBe(0);
    expect(slotsHoursInPeriod([], week, spread)).toBe(0);
    expect(slotsHoursInPeriod(undefined, week, spread)).toBe(0);
  });
});

describe('projectHoursInPeriod MANUAL vs EVEN (WI-47)', () => {
  const hoursByDay = buildHoursByDay(calendar);
  const spread = { hoursByDay };
  const week = period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40);

  it('MANUAL: загрузка = Σ слотов (НЕ EVEN-раскид plannedEffort)', () => {
    const p = project({
      planMethod: 'MANUAL',
      plannedEffort: 1000, // игнорируется в MANUAL
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    const slotsByProject = buildSlotsByProject([
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 80 },
    ]);
    // январь раскидан по рабочим дням, неделя 12..18 → 40ч (а не 1000-раскид).
    expect(projectHoursInPeriod(p, week, spread, slotsByProject)).toBeCloseTo(40);
  });

  it('MANUAL без слотов → fallback на EVEN (проект не пустой)', () => {
    const p = project({ planMethod: 'MANUAL', plannedEffort: 80, startDate: '2026-01-12', endDate: '2026-01-25' });
    const empty = buildSlotsByProject([]);
    const manual = projectHoursInPeriod(p, week, spread, empty);
    const even = projectHoursInPeriod({ ...p, planMethod: 'EVEN' }, week, spread);
    expect(manual).toBeCloseTo(even);
    expect(manual).toBeGreaterThan(0);
  });

  it('EVEN не сломан: дефолтное поведение без слотов и без planMethod', () => {
    // регресс-проверка: исходный кейс (проект 01-01..01-10, план 100, 5-дн период) = 50
    const p5 = period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40);
    expect(projectHoursInPeriod(project(), p5)).toBe(50);
    // planMethod=EVEN явно — то же
    expect(projectHoursInPeriod(project({ planMethod: 'EVEN' }), p5)).toBe(50);
    // слоты переданы, но режим EVEN → слоты игнорируются
    const slotsByProject = buildSlotsByProject([
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 999 },
    ]);
    expect(projectHoursInPeriod(project({ planMethod: 'EVEN' }), p5, undefined, slotsByProject)).toBe(50);
  });
});

describe('projectDeptHoursInPeriod MANUAL (WI-47, отделы)', () => {
  const hoursByDay = buildHoursByDay(calendar);
  const spread = { hoursByDay };
  const week = period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40);

  it('слот без отдела → «родному» отделу проекта', () => {
    const p = project({ id: 'p1', departmentId: 'd1', planMethod: 'MANUAL', plannedEffort: 0 });
    const slotsByProject = buildSlotsByProject([
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 80 },
    ]);
    expect(projectDeptHoursInPeriod(p, 'd1', week, undefined, spread, slotsByProject)).toBeCloseTo(40);
    expect(projectDeptHoursInPeriod(p, 'd2', week, undefined, spread, slotsByProject)).toBe(0);
  });

  it('слот с departmentId → именно тому отделу', () => {
    const p = project({ id: 'p1', departmentId: 'd1', planMethod: 'MANUAL', plannedEffort: 0 });
    const slotsByProject = buildSlotsByProject([
      { projectId: 'p1', departmentId: 'd2', periodMonth: '2026-01', plannedHours: 80 },
    ]);
    expect(projectDeptHoursInPeriod(p, 'd2', week, undefined, spread, slotsByProject)).toBeCloseTo(40);
    expect(projectDeptHoursInPeriod(p, 'd1', week, undefined, spread, slotsByProject)).toBe(0);
  });
});

describe('deptLoadCells MANUAL (WI-47, интеграция)', () => {
  const hoursByDay = buildHoursByDay(calendar);
  const spread = { hoursByDay };
  const periods = [
    period('w1', utc(2026, 0, 12), utc(2026, 0, 18), 40),
    period('w2', utc(2026, 0, 19), utc(2026, 0, 25), 40),
  ];

  it('MANUAL: загрузка отдела = Σ слотов по месяцу (раскид по неделям)', () => {
    const p = project({ id: 'p1', departmentId: 'd1', planMethod: 'MANUAL', plannedEffort: 0 });
    const slotsByProject = buildSlotsByProject([
      { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 80 },
    ]);
    const cells = deptLoadCells(dept(), [p], periods, [], undefined, undefined, undefined, spread, slotsByProject);
    // Σ загрузки по двум неделям = весь месячный слот 80ч.
    expect(cells[0].load + cells[1].load).toBeCloseTo(80);
  });

  it('EVEN не сломан: без slotsByProject поведение прежнее', () => {
    const p = project({ id: 'p1', departmentId: 'd1', plannedEffort: 80, startDate: '2026-01-12', endDate: '2026-01-25' });
    const cells = deptLoadCells(dept(), [p], periods, [], undefined, undefined, undefined, spread);
    expect(cells[0].load + cells[1].load).toBeCloseTo(80);
  });
});

describe('slotsVsPlannedEffort / sumSlotHours (WI-47, Σ-сверка для Dev1)', () => {
  const slots: PlanSlot[] = [
    { projectId: 'p1', departmentId: null, periodMonth: '2026-01', plannedHours: 30 },
    { projectId: 'p1', departmentId: null, periodMonth: '2026-02', plannedHours: 20 },
    { projectId: 'p1', departmentId: null, periodMonth: 'bad', plannedHours: 999 }, // игнор
  ];

  it('sumSlotHours суммирует только валидные месяцы', () => {
    expect(sumSlotHours(slots)).toBe(50);
    expect(sumSlotHours(undefined)).toBe(0);
  });

  it('matches=true при совпадении Σ слотов и plannedEffort', () => {
    expect(slotsVsPlannedEffort(slots, 50)).toEqual({ sum: 50, gap: 0, matches: true });
  });

  it('gap при рассинхроне, matches=false (мягко, не блок)', () => {
    expect(slotsVsPlannedEffort(slots, 60)).toEqual({ sum: 50, gap: -10, matches: false });
  });

  it('plannedEffort=null → gap=null, matches=true (нечего сверять)', () => {
    expect(slotsVsPlannedEffort(slots, null)).toEqual({ sum: 50, gap: null, matches: true });
  });
});
