// Подпись месяца тренда: 'YYYY-MM' → «янв 2026» (короткий русский) / «янв».
// Чистая функция (без host-DOM, без Intl-локали) — детерминирована и тестируема.

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

// 'YYYY-MM' → { mon: 'янв', year: '2026' }. Невалидный вход → пустые поля.
export const splitMonth = (ym: string): { mon: string; year: string } => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return { mon: '', year: '' };
  const idx = Number(m[2]) - 1;
  return { mon: MONTHS_SHORT[idx] ?? '', year: m[1] };
};

// Полная подпись: «янв 2026» (showYear=true) или «янв».
export const monthLabel = (ym: string, showYear = false): string => {
  const { mon, year } = splitMonth(ym);
  if (!mon) return ym; // деградация: показать как есть
  return showYear ? `${mon} ${year}` : mon;
};

// Подпись недели по границам 'YYYY-MM-DD'..'YYYY-MM-DD' (вкл.):
//   • один месяц  → «13–19 января 2026»
//   • разные мес. → «30 декабря – 5 января 2026»
// Невалидный вход → «from – to» (деградация). Чистая функция.
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const parseDay = (iso: string): { d: number; m: number; y: number } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
};
export const weekRangeLabel = (from: string, to: string): string => {
  const a = parseDay(from);
  const b = parseDay(to);
  if (!a || !b) return `${from} – ${to}`;
  const mB = MONTHS_GEN[b.m] ?? '';
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${mB} ${b.y}`;
  const mA = MONTHS_GEN[a.m] ?? '';
  const left = a.y === b.y ? `${a.d} ${mA}` : `${a.d} ${mA} ${a.y}`;
  return `${left} – ${b.d} ${mB} ${b.y}`;
};
