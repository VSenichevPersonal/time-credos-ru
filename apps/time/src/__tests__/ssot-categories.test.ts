/**
 * SSOT-guard: синхронность справочника категорий проектов.
 *
 * Правильная цепочка:
 *   domain-types.ts → labels.ts → select-options.ts →
 *     tag-color-hex.ts → category-meta.ts → [UI компоненты]
 *
 * Тест проверяет: каждое звено цепочки синхронно.
 * Добавление категории в WORK_CATEGORY_OPTIONS → §1-3 покроют автоматически.
 */

import { describe, expect, it } from 'vitest';

import { CLIENT_CATEGORY, WORK_CATEGORY_OPTIONS } from 'src/constants/select-options';
import { WORK_CATEGORY_LABELS } from 'src/constants/labels';
import { categoryMeta, CATEGORY_ORDER } from 'src/front-components/shared/category-meta';
import { TAG_COLOR_HEX } from 'src/front-components/shared/tag-color-hex';

// Коды категорий как они приходят из БД (SDK UPPER_SNAKE).
const CODES: string[] = WORK_CATEGORY_OPTIONS.map((o) => o.value);

// ─── 1. WORK_CATEGORY_OPTIONS — базовый инвариант ─────────────────────────

describe('SSOT: WORK_CATEGORY_OPTIONS полный (domain-types → select-options)', () => {
  it('нет дублей кодов', () => {
    const unique = new Set(CODES);
    expect(unique.size).toBe(CODES.length);
  });

  it('каждая опция имеет value + label + position', () => {
    for (const opt of WORK_CATEGORY_OPTIONS) {
      expect(opt.value, `${opt.value} — value пуст`).toBeTruthy();
      expect(opt.label, `${opt.value} — label пуст`).toBeTruthy();
      expect(typeof opt.position, `${opt.value} — position не number`).toBe('number');
    }
  });

  it('все WORK_CATEGORY_LABELS покрыты опцией (нет мёртвых label)', () => {
    for (const key of Object.keys(WORK_CATEGORY_LABELS)) {
      const code = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
      expect(CODES, `label "${key}" (code "${code}") нет в WORK_CATEGORY_OPTIONS`).toContain(code);
    }
  });

  it('коды только UPPER_SNAKE (как ожидает бэкенд)', () => {
    for (const code of CODES) {
      expect(code, `code "${code}" не UPPER_SNAKE`).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});

// ─── 2. tag-color-hex — все TagColor имеют hex ────────────────────────────

describe('SSOT: tag-color-hex покрывает все TagColor из select-options', () => {
  it('каждый цвет из WORK_CATEGORY_OPTIONS есть в TAG_COLOR_HEX', () => {
    for (const opt of WORK_CATEGORY_OPTIONS) {
      const colorName = opt.color as string;
      if (!colorName) continue; // нет цвета — ok (использует FALLBACK)
      expect(
        TAG_COLOR_HEX,
        `WORK_CATEGORY_OPTIONS["${opt.value}"].color = "${colorName}" нет в TAG_COLOR_HEX`,
      ).toHaveProperty(colorName);
    }
  });

  it('все TagColor имеют solid (тёмный) и tint (светлый)', () => {
    for (const [name, col] of Object.entries(TAG_COLOR_HEX)) {
      expect(col.solid, `${name}.solid пуст`).toMatch(/^#[0-9a-f]{3,8}$/i);
      expect(col.tint, `${name}.tint пуст`).toMatch(/^#[0-9a-f]{3,8}$/i);
      expect(col.solid, `${name}: solid == tint`).not.toBe(col.tint);
    }
  });
});

// ─── 3. category-meta — динамический SSOT-фасад ───────────────────────────

describe('SSOT: category-meta (фасад для UI) динамически покрывает все категории', () => {
  it('CATEGORY_ORDER содержит все коды из WORK_CATEGORY_OPTIONS', () => {
    for (const code of CODES) {
      expect(CATEGORY_ORDER, `"${code}" нет в CATEGORY_ORDER`).toContain(code);
    }
  });

  it('CATEGORY_ORDER без дублей', () => {
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });

  it('categoryMeta(code) для каждого кода из WORK_CATEGORY_OPTIONS — не fallback', () => {
    for (const code of CODES) {
      const m = categoryMeta(code);
      expect(m.value, `${code}: meta.value неверный`).toBe(code);
      expect(m.label, `${code}: meta.label пустой`).toBeTruthy();
      expect(m.solid, `${code}: meta.solid пуст`).toMatch(/^#[0-9a-f]{3,8}$/i);
      expect(m.tint, `${code}: meta.tint пуст`).toMatch(/^#[0-9a-f]{3,8}$/i);
    }
  });

  it('categoryMeta("UNKNOWN_CAT") — graceful fallback, не crash', () => {
    const m = categoryMeta('UNKNOWN_CAT');
    expect(m.value).toBe('UNKNOWN_CAT');
    expect(m.label).toBeTruthy();
    expect(m.order).toBe(999); // в конец
  });

  it('categoryMeta("OTHER") — label = "Прочее", не raw "OTHER"', () => {
    const m = categoryMeta('OTHER');
    expect(m.label).toBe('Прочее');
    expect(m.order).toBe(999);
  });
});

// ─── 4. CLIENT_CATEGORY — утилизация не сломается при изменении ───────────

describe('SSOT: CLIENT_CATEGORY (инвариант утилизации)', () => {
  it('CLIENT_CATEGORY есть в WORK_CATEGORY_OPTIONS (не устарел)', () => {
    // [ssot-bug]#1 CLOSED (Dev 2): CLIENT_CATEGORY = toUpperSnake(WorkCategory 'Client')
    // из constants/select-options.ts. Типовая завязка → переименование WorkCategory = compile error.
    expect(CODES).toContain(CLIENT_CATEGORY);
  });

  it('CLIENT_CATEGORY = "CLIENT" — UPPER_SNAKE от WorkCategory "Client"', () => {
    // При переименовании 'Client' в domain-types: toUpperSnake() изменится → тест упадёт.
    expect(CLIENT_CATEGORY).toBe('CLIENT');
  });
});

// ─── 5. category-bar.tsx → SSOT (закрыто Dev 1 DP-0003) ──────────────────

describe('SSOT: category-bar.tsx — ЗАКРЫТО (DP-0003, Dev 1)', () => {
  it.todo(
    '[ssot-bug]#2 CLOSED (DP-0003): category-bar.tsx переписан на categoryMeta/CATEGORY_ORDER. ' +
    'Хардкод CATS+ORDER удалён. Закрыто Dev 1 в батче DP-0003. Тест-guard §3 выше достаточен.',
  );

  it.todo(
    '[ssot-bug]#4 (P3): "OTHER" — синтетическая категория в reports-calc:catOfEntry, ' +
    'нет в WORK_CATEGORY_OPTIONS. ' +
    'category-meta.ts обрабатывает gracefully (label="Прочее", order=999). ' +
    'Fix: добавить "Other" в WorkCategory+WORK_CATEGORY_OPTIONS+WORK_CATEGORY_LABELS, ' +
    'тогда categoryMeta("OTHER") будет из справочника, не хардкода.',
  );
});
