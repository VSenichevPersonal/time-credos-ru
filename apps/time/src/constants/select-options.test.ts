import { describe, expect, it } from 'vitest';

import { ENTRY_STATUS } from 'src/constants/approval';
import {
  BILLING_DOC_TYPE_OPTIONS,
  DEPARTMENT_CODE_OPTIONS,
  ENTRY_STATUS_DEFAULT,
  ENTRY_STATUS_OPTIONS,
  PROJECT_STATUS_DEFAULT,
  PROJECT_STATUS_OPTIONS,
  WORKDAY_TYPE_DEFAULT,
  WORKDAY_TYPE_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  WORK_TYPE_GROUP_OPTIONS,
} from 'src/constants/select-options';

const ALL_OPTION_SETS = {
  DEPARTMENT_CODE_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  WORK_TYPE_GROUP_OPTIONS,
  ENTRY_STATUS_OPTIONS,
  BILLING_DOC_TYPE_OPTIONS,
  WORKDAY_TYPE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
};

// SDK требует value SELECT в UPPER_CASE snake_case. Эти инварианты держат
// пиклисты валидными для накатки и читаемыми в UI.
describe.each(Object.entries(ALL_OPTION_SETS))('SELECT-набор %s', (_name, options) => {
  it('value в UPPER_CASE snake_case (требование SDK)', () => {
    for (const o of options) expect(o.value).toMatch(/^[A-Z0-9]+(_[A-Z0-9]+)*$/);
  });

  it('label непустой (русский ярлык для UI)', () => {
    for (const o of options) expect(o.label.length).toBeGreaterThan(0);
  });

  it('position последователен 0..n-1 (порядок в пиклисте)', () => {
    expect(options.map((o) => o.position)).toEqual(options.map((_, i) => i));
  });

  it('color задан (тег читаем)', () => {
    for (const o of options) expect(o.color.length).toBeGreaterThan(0);
  });

  it('value уникальны внутри набора', () => {
    const values = options.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('buildOptions: camelCase/PascalCase → UPPER_SNAKE', () => {
  it('projectManagement → PROJECT_MANAGEMENT', () => {
    const v = WORK_TYPE_GROUP_OPTIONS.map((o) => o.value);
    expect(v).toContain('PROJECT_MANAGEMENT');
    expect(v).toContain('PRODUCTION');
  });

  it('PascalCase Client → CLIENT', () => {
    expect(WORK_CATEGORY_OPTIONS.map((o) => o.value)).toContain('CLIENT');
  });
});

// КРИТИЧНЫЙ cross-SSOT guard: коды статуса записи в БД (approval.ts ENTRY_STATUS,
// которыми пишет approval.logic) ДОЛЖНЫ совпадать со значениями SELECT-опции.
// Рассинхрон = approve/submit пишут код, которого нет в пиклисте → молчаливый
// провал статуса в UI/БД.
describe('cross-SSOT: ENTRY_STATUS ↔ ENTRY_STATUS_OPTIONS', () => {
  it('множества кодов совпадают', () => {
    const optionValues = new Set(ENTRY_STATUS_OPTIONS.map((o) => o.value));
    const statusCodes = new Set(Object.values(ENTRY_STATUS));
    expect(optionValues).toEqual(statusCodes);
  });
});

// Дефолты SELECT хранятся как "'VALUE'" (UPPER_CASE в одинарных кавычках, SDK).
// Значение по умолчанию обязано существовать среди опций.
describe('дефолты ссылаются на существующее значение', () => {
  const unquote = (s: string) => s.replace(/'/g, '');

  it('ENTRY_STATUS_DEFAULT ∈ ENTRY_STATUS_OPTIONS', () => {
    expect(ENTRY_STATUS_OPTIONS.map((o) => o.value)).toContain(unquote(ENTRY_STATUS_DEFAULT));
  });

  it('PROJECT_STATUS_DEFAULT ∈ PROJECT_STATUS_OPTIONS', () => {
    expect(PROJECT_STATUS_OPTIONS.map((o) => o.value)).toContain(unquote(PROJECT_STATUS_DEFAULT));
  });

  it('WORKDAY_TYPE_DEFAULT ∈ WORKDAY_TYPE_OPTIONS', () => {
    expect(WORKDAY_TYPE_OPTIONS.map((o) => o.value)).toContain(unquote(WORKDAY_TYPE_DEFAULT));
  });
});
