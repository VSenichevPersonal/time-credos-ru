import { describe, expect, it } from 'vitest';

import { ENTRY_STATUS } from 'src/constants/approval';
import {
  BILLING_DOC_TYPE_OPTIONS,
  BOOKING_TYPE_DEFAULT,
  BOOKING_TYPE_OPTIONS,
  DEPARTMENT_CODE_OPTIONS,
  ENTRY_STATUS_DEFAULT,
  ENTRY_STATUS_OPTIONS,
  ENTRY_TAG_OPTIONS,
  PROJECT_STATUS_DEFAULT,
  PROJECT_STATUS_OPTIONS,
  WORKDAY_TYPE_DEFAULT,
  WORKDAY_TYPE_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  WORK_TYPE_GROUP_OPTIONS,
} from 'src/constants/select-options';
import { ENTRY_TAG_LABELS } from 'src/constants/labels';
import type { EntryTag } from 'src/constants/domain-types';

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

// ─── ENTRY_TAG_OPTIONS SSOT-guard (W3-2) ──────────────────────────────────────

// Кросс-SSOT: domain-types.EntryTag ↔ labels.ENTRY_TAG_LABELS ↔ select-options.ENTRY_TAG_OPTIONS.
// buildOptions() применяет toUpperSnake(PascalCase) → опции хранят UPPER_SNAKE (SDK-требование).
// Ловит рассинхрон при добавлении нового тега.
describe('ENTRY_TAG_OPTIONS — SSOT cross-check (W3-2)', () => {
  // domain-types.EntryTag в UPPER_SNAKE = значения SELECT (SDK) = option.value:
  // ключ union/labels/colors совпадает с value, ENTRY_TAG_LABELS[value] резолвится
  // напрямую (нет приведения регистра в рендере чипов).
  const TAG_CODES = ['OVERTIME', 'URGENT', 'REMOTE', 'ON_SITE', 'REWORK', 'RESEARCH'] as EntryTag[];

  it('6 тегов (по числу EntryTag в domain-types)', () => {
    expect(ENTRY_TAG_OPTIONS).toHaveLength(6);
  });

  it('значения опций = UPPER_SNAKE (SDK-требование) = коды EntryTag', () => {
    const optionValues = ENTRY_TAG_OPTIONS.map((o) => o.value).sort();
    expect(optionValues).toEqual([...TAG_CODES].sort());
  });

  it('все label непустые русские строки (лейблы из ENTRY_TAG_LABELS)', () => {
    expect(ENTRY_TAG_OPTIONS.every((o) => typeof o.label === 'string' && o.label.length > 0)).toBe(true);
  });

  it('ENTRY_TAG_LABELS[value] резолвится по option.value (рендер чипов)', () => {
    // value=ключ=union → lookup напрямую; именно это чинит баг ярлыков чипов.
    const expectedLabels = TAG_CODES.map((t) => ENTRY_TAG_LABELS[t]);
    const actualLabels = ENTRY_TAG_OPTIONS.map((o) => o.label);
    expect(actualLabels).toEqual(expectedLabels);
    for (const o of ENTRY_TAG_OPTIONS) {
      expect(ENTRY_TAG_LABELS[o.value as EntryTag]).toBe(o.label);
    }
  });

  it('каждый тег имеет color', () => {
    expect(ENTRY_TAG_OPTIONS.every((o) => typeof o.color === 'string' && o.color.length > 0)).toBe(true);
  });

  it('ENTRY_TAG_LABELS покрывает все 6 тегов (нет пропусков)', () => {
    expect(new Set(Object.keys(ENTRY_TAG_LABELS))).toEqual(new Set(TAG_CODES));
  });

  it('все label непустые строки в ENTRY_TAG_LABELS', () => {
    expect(Object.values(ENTRY_TAG_LABELS).every((l) => typeof l === 'string' && l.length > 0)).toBe(true);
  });
});

describe('BOOKING_TYPE_OPTIONS (REQ-0004)', () => {
  it('содержит SOFT и HARD', () => {
    const values = BOOKING_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toContain('SOFT');
    expect(values).toContain('HARD');
  });

  it('позиции уникальны и начинаются с 0', () => {
    const positions = BOOKING_TYPE_OPTIONS.map((o) => o.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect(Math.min(...positions)).toBe(0);
  });

  it('BOOKING_TYPE_DEFAULT = SOFT (соответствует draftBooking UX)', () => {
    expect(BOOKING_TYPE_DEFAULT).toContain('SOFT');
  });

  it('все options имеют label и color', () => {
    for (const o of BOOKING_TYPE_OPTIONS) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.color).toBeTruthy();
    }
  });
});
