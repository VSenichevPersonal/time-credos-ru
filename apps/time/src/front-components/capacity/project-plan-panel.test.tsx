import { describe, expect, it } from 'vitest';

import { methodOf } from 'src/front-components/capacity/project-plan-panel';
import type { CapProject } from 'src/front-components/capacity/types';

// SSOT planMethod (round-trip): init/reset панели «План» берут способ раскида из
// сохранённого project.planMethod. Баг — MANUAL-проект открывался как EVEN, и
// ручной раскид игнорировался calc-load. methodOf — ядро init (:78) и reset (:164);
// env=node не даёт mount компонента, поэтому проверяем чистую функцию.

const make = (planMethod?: CapProject['planMethod']): CapProject => ({
  id: 'p1',
  code: null,
  name: 'Проект',
  departmentId: null,
  plannedEffort: null,
  startDate: null,
  endDate: null,
  planMethod,
});

describe('methodOf — init/reset способа из project.planMethod (SSOT)', () => {
  it('MANUAL → панель открывается в ручном режиме', () => {
    expect(methodOf(make('MANUAL'))).toBe('MANUAL');
  });

  it('EVEN → равномерно', () => {
    expect(methodOf(make('EVEN'))).toBe('EVEN');
  });

  it('пусто (undefined) → дефолт EVEN', () => {
    expect(methodOf(make(undefined))).toBe('EVEN');
  });

  it('null → дефолт EVEN', () => {
    expect(methodOf(make(null))).toBe('EVEN');
  });
});
