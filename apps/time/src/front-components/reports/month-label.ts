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
