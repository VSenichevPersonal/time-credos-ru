import { describe, expect, it } from 'vitest';

import {
  absenceHoursByEmpInPeriod,
  absenceHoursInPeriod,
  buildAbsenceCtx,
  buildHoursByDay,
  buildPeriods,
  buildSharesByProject,
  deptCapacity,
  deptLoadCells,
  deptPlanHoursInPeriod,
  deptPlanLoads,
  deptProjectLoads,
  employeeLoadCells,
  firstFreePeriod,
  projectHoursInPeriod,
  projectShareHoursInPeriod,
  summaryCells,
} from 'src/front-components/capacity/calc-load';
import type {
  Absence,
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptRef,
  EmployeeRef,
  LoadCell,
  Period,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

// LoadCell-фикстура: ratio и free выводятся из capacity/load (как в calc-load).
const cell = (capacity: number, load: number): LoadCell => ({
  capacity,
  load,
  free: capacity - load,
  ratio: capacity > 0 ? load / capacity : null,
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
});
