import { describe, expect, it } from 'vitest';

import {
  isIsoDate,
  isUuid,
  validDateParam,
  validUuidParam,
} from './params-validate';

// CISO-006: валидаторы режут инъекцию в Twenty REST filter-строки (запятая =
// разделитель условий). Ключевой кейс — значение с запятой/доп. условием.

describe('isIsoDate', () => {
  it('принимает ISO-date и ISO-datetime', () => {
    expect(isIsoDate('2026-06-30')).toBe(true);
    expect(isIsoDate('2026-01-01T00:00:00.000Z')).toBe(true);
    expect(isIsoDate('2026-06-30T23:59:59Z')).toBe(true);
  });

  it('отклоняет инъекцию и мусор', () => {
    // Главный вектор CISO-006: запятая = новое условие фильтра.
    expect(isIsoDate('2026-01-01,someField[eq]:x')).toBe(false);
    expect(isIsoDate('2026-13-40')).toBe(true); // формат проходит — диапазон не наша забота, инъекции нет
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate('2026/06/30')).toBe(false);
    expect(isIsoDate("2026-01-01' OR '1")).toBe(false);
  });
});

describe('isUuid', () => {
  it('принимает UUID', () => {
    expect(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
  });
  it('отклоняет не-UUID и инъекцию', () => {
    expect(isUuid('abc')).toBe(false);
    expect(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301,status[eq]:APPROVED')).toBe(false);
  });
});

describe('validDateParam', () => {
  it('отсутствует/пусто → fallback', () => {
    expect(validDateParam(undefined, 'FB')).toBe('FB');
    expect(validDateParam('', 'FB')).toBe('FB');
  });
  it('валидный → значение', () => {
    expect(validDateParam('2026-06-30', 'FB')).toBe('2026-06-30');
  });
  it('невалидный/инъекция → throw (не молчаливый fallback)', () => {
    expect(() => validDateParam('2026-01-01,x[eq]:1', 'FB')).toThrow('invalid date parameter');
    expect(() => validDateParam('garbage', 'FB')).toThrow();
  });
});

describe('validUuidParam', () => {
  it('отсутствует → null', () => {
    expect(validUuidParam(undefined)).toBeNull();
    expect(validUuidParam('')).toBeNull();
  });
  it('валидный → значение', () => {
    expect(validUuidParam('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(
      '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    );
  });
  it('невалидный/инъекция → throw', () => {
    expect(() => validUuidParam('3f2504e0,status[eq]:APPROVED')).toThrow('invalid id parameter');
  });
});
