import { WORK_CATEGORY_OPTIONS } from 'src/constants/select-options';

import { tagColorHex } from 'src/front-components/shared/tag-color-hex';

// SSOT-метаданные категорий работ для UI (ярлык/цвет/порядок) — ДИНАМИЧЕСКИ из
// справочника `WORK_CATEGORY_OPTIONS` (domain-types + labels + select-options).
// Никакого хардкода списка/цветов в компонентах: добавили категорию в SSOT →
// дашборд/чипы/легенда подхватили. Reports отдаёт UPPER_CASE-коды = option.value.

export type CategoryMeta = {
  value: string; // UPPER_CASE (CLIENT/PRESALE/…)
  label: string; // русский ярлык из SSOT
  order: number; // позиция из SSOT (стабильный порядок сегментов/легенды)
  solid: string; // насыщенный цвет (сегмент/точка)
  tint: string; // светлый фон (чип)
};

const BY_VALUE: Record<string, CategoryMeta> = Object.fromEntries(
  WORK_CATEGORY_OPTIONS.map((o) => {
    const c = tagColorHex(o.color);
    return [o.value, { value: o.value, label: o.label, order: o.position, solid: c.solid, tint: c.tint }];
  }),
);

// Порядок категорий = порядок справочника (для стабильных сегментов/легенды).
export const CATEGORY_ORDER: string[] = WORK_CATEGORY_OPTIONS.map((o) => o.value);

export const categoryMeta = (code: string): CategoryMeta => {
  const m = BY_VALUE[code];
  if (m) return m;
  const c = tagColorHex(null);
  // Неизвестный код (напр. OTHER от бэка) — нейтраль, в конец.
  return { value: code, label: code === 'OTHER' ? 'Прочее' : code, order: 999, solid: c.solid, tint: c.tint };
};
