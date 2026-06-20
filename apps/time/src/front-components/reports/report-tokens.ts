import { T, FONT } from 'src/front-components/grid/tokens';

export { T, FONT };

// Форматтеры и цвета дашборда отчётов. Палитра тинт-нейтральная, акцент ≤10%.

// Утилизация в процентах (0 знаков). null → «—».
export const fmtUtil = (util: number | null): string =>
  util === null ? '—' : `${Math.round(util * 100)}%`;

// Целые часы с разделителем тысяч (узкий неразрывный пробел), tabular-nums.
export const fmtHrs = (n: number): string =>
  Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

// Недогруз: > 0 — недозагрузка (спокойный нейтральный), < 0 — перегруз (тревога).
// null (нет нормы) → пусто.
export const fmtUnder = (under: number | null): string => {
  if (under === null) return '—';
  const v = Math.round(under);
  if (v === 0) return '0';
  return v > 0 ? `−${fmtHrs(v)}` : `+${fmtHrs(-v)}`; // недобор «−», перегруз «+»
};

export type Tone = { fg: string; bg: string };

// Тон недогруза: недобор — спокойный нейтральный, перегруз — терракот-тревога.
export const underTone = (under: number | null): Tone => {
  if (under === null) return { fg: T.textFaint, bg: 'transparent' };
  if (under < -0.5) return { fg: T.over, bg: T.overSoft }; // перегруз
  if (under > 0.5) return { fg: T.under, bg: 'transparent' }; // недобор
  return { fg: T.ok, bg: 'transparent' }; // ровно норма
};

// Тон утилизации для подписи (высокая клиентская доля — позитив, низкая — тихо).
export const utilTone = (util: number | null): string => {
  if (util === null) return T.textFaint;
  if (util >= 0.7) return T.ok;
  if (util >= 0.4) return T.text;
  return T.textMuted;
};
