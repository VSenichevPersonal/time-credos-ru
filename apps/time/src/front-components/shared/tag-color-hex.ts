// Палитра Twenty TagColor (имя → hex). SSOT цвета задаются в справочниках именем
// (TagColor), а рендерим мы — нужен hex. Это единственная точка резолва имени в
// цвет; добавили категорию с новым TagColor в select-options → тут уже есть.
// solid — насыщенный (сегмент/точка), tint — светлый (фон чипа).
// blue совпадает с учётным акцентом (T.accent/accentSoft) — берём из tokens, чтобы
// бренд-синий не дрейфовал между чипом и кнопками.
import { T } from 'src/front-components/shared/tokens';

export type TagColorName =
  | 'red' | 'orange' | 'yellow' | 'green' | 'blue'
  | 'sky' | 'turquoise' | 'purple' | 'pink' | 'gray';

export const TAG_COLOR_HEX: Record<TagColorName, { solid: string; tint: string }> = {
  red: { solid: '#d6492f', tint: '#fbe4dd' },
  orange: { solid: '#c2700c', tint: '#f9eede' },
  yellow: { solid: '#b08a0a', tint: '#f7f0d8' },
  green: { solid: '#2f9e57', tint: '#e6f4ec' },
  blue: { solid: T.accent, tint: T.accentSoft },
  sky: { solid: '#0e8fd6', tint: '#e2f1fb' },
  turquoise: { solid: '#0e9aa0', tint: '#e2f4f4' },
  purple: { solid: '#7c5cdb', tint: '#efebfb' },
  pink: { solid: '#cf4d92', tint: '#fae6f1' },
  gray: { solid: '#7c8597', tint: '#eef0f3' },
};

const FALLBACK = { solid: T.textFaint, tint: '#f0f1f3' };

export const tagColorHex = (name: string | null | undefined): { solid: string; tint: string } =>
  (name ? TAG_COLOR_HEX[name as TagColorName] : undefined) ?? FALLBACK;
