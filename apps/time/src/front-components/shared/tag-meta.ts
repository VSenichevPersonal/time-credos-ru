import { ENTRY_TAG_OPTIONS } from 'src/constants/select-options';

import { tagColorHex } from 'src/front-components/shared/tag-color-hex';

// SSOT-метаданные тегов записи для UI (ярлык/цвет/порядок) — ДИНАМИЧЕСКИ из
// справочника `ENTRY_TAG_OPTIONS` (domain-types + labels + select-options).
// Никакого хардкода списка/цветов в компонентах: добавили тег в SSOT → чипы и
// фильтр подхватили. Значения MULTI_SELECT (option.value) совпадают с EntryTag.

export type TagMeta = {
  value: string; // код тега (Overtime/Urgent/…)
  label: string; // русский ярлык из SSOT
  order: number; // позиция из SSOT (стабильный порядок чипов)
  solid: string; // насыщенный цвет (точка/обводка)
  tint: string; // светлый фон (чип)
};

const BY_VALUE: Record<string, TagMeta> = Object.fromEntries(
  ENTRY_TAG_OPTIONS.map((o) => {
    const c = tagColorHex(o.color);
    return [o.value, { value: o.value, label: o.label, order: o.position, solid: c.solid, tint: c.tint }];
  }),
);

// Порядок тегов = порядок справочника (для стабильной сортировки чипов).
export const TAG_ORDER: string[] = ENTRY_TAG_OPTIONS.map((o) => o.value);

export const tagMeta = (code: string): TagMeta => {
  const m = BY_VALUE[code];
  if (m) return m;
  const c = tagColorHex(null);
  // Неизвестный код — нейтраль, в конец (миграция/будущие значения).
  return { value: code, label: code, order: 999, solid: c.solid, tint: c.tint };
};

// Сортировка набора тегов записи по порядку справочника (стабильный вид).
export const sortTags = (tags: string[]): string[] =>
  [...tags].sort((a, b) => tagMeta(a).order - tagMeta(b).order);
