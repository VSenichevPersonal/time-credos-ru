import { describe, expect, it } from 'vitest';

import {
  BILLING_DOC_TYPE_LABELS,
  DEPARTMENT_LABELS,
  ENTRY_STATUS_LABELS,
  WEEKLY_NORM_HOURS,
  WORK_CATEGORY_LABELS,
  WORK_TYPE_GROUP_LABELS,
} from 'src/constants/labels';
import {
  BILLING_DOC_TYPE_OPTIONS,
  DEPARTMENT_CODE_OPTIONS,
  ENTRY_STATUS_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  WORK_TYPE_GROUP_OPTIONS,
} from 'src/constants/select-options';

// Реплика преобразования из select-options (граница domain-код → SELECT value).
const toUpperSnake = (v: string): string =>
  v.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

type SelectOption = { value: string; label: string };

// Пары «словарь ярлыков ↔ набор SELECT-опций». Cross-SSOT: код, добавленный в
// labels, но забытый в order-массиве select-options, молча пропадёт из дропдауна.
const PAIRS: Array<[string, Record<string, string>, SelectOption[]]> = [
  ['DEPARTMENT', DEPARTMENT_LABELS, DEPARTMENT_CODE_OPTIONS],
  ['WORK_CATEGORY', WORK_CATEGORY_LABELS, WORK_CATEGORY_OPTIONS],
  ['WORK_TYPE_GROUP', WORK_TYPE_GROUP_LABELS, WORK_TYPE_GROUP_OPTIONS],
  ['ENTRY_STATUS', ENTRY_STATUS_LABELS, ENTRY_STATUS_OPTIONS],
  ['BILLING_DOC_TYPE', BILLING_DOC_TYPE_LABELS, BILLING_DOC_TYPE_OPTIONS],
];

describe.each(PAIRS)('cross-SSOT labels ↔ options: %s', (_name, labels, options) => {
  it('каждый код из labels присутствует в опциях (не выпал из дропдауна)', () => {
    const optionValues = new Set(options.map((o) => o.value));
    const labelValues = new Set(Object.keys(labels).map(toUpperSnake));
    expect(optionValues).toEqual(labelValues);
  });

  it('ярлык опции совпадает с labels[код] (UI показывает правильный русский текст)', () => {
    for (const [code, label] of Object.entries(labels)) {
      const opt = options.find((o) => o.value === toUpperSnake(code));
      expect(opt, `опция для кода ${code}`).toBeDefined();
      expect(opt?.label).toBe(label);
    }
  });

  it('все ярлыки непустые', () => {
    for (const label of Object.values(labels)) expect(label.trim().length).toBeGreaterThan(0);
  });
});

describe('WEEKLY_NORM_HOURS', () => {
  it('= 40 ч/нед (норма планирования загрузки)', () => {
    expect(WEEKLY_NORM_HOURS).toBe(40);
  });
});
