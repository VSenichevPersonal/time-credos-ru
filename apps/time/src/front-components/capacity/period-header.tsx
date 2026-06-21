import { T, SIGMA_W } from 'src/front-components/capacity/cap-tokens';
import type { Period } from 'src/front-components/capacity/types';

// Ячейка фиксированной ширины Σ-горизонта (выравнивание со строками).
const sigmaCell = (height: number, content: React.ReactNode, faint = false) => (
  <div
    style={{
      width: SIGMA_W,
      minWidth: SIGMA_W,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderLeft: `1px solid ${T.borderStrong}`,
      fontSize: 11,
      fontWeight: 600,
      color: faint ? T.textFaint : T.textMuted,
    }}
  >
    {content}
  </div>
);

// Шапка: для недель — 2 строки (месяц-бэнд → день), для месяцев — одна строка.
// Колонка 0 = текущий период (горизонт начинается «сегодня») — тонкий тик «сейчас».

type Props = { periods: Period[]; nameWidth: number; granularity: 'week' | 'month' };

const MONTHS_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

type Band = { key: string; label: string; span: number };

const monthBands = (periods: Period[]): Band[] => {
  const bands: Band[] = [];
  for (const p of periods) {
    const key = `${p.from.getUTCFullYear()}-${p.from.getUTCMonth()}`;
    const last = bands[bands.length - 1];
    if (last && last.key === key) last.span += 1;
    else bands.push({ key, label: MONTHS_FULL[p.from.getUTCMonth()], span: 1 });
  }
  return bands;
};

const cornerStyle = (nameWidth: number, height: number) =>
  ({
    width: nameWidth,
    minWidth: nameWidth,
    height,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    borderRight: `1px solid ${T.border}`,
    background: T.headerBg,
    position: 'sticky' as const,
    left: 0,
    zIndex: 1,
    fontSize: 12,
    fontWeight: 600,
    color: T.textMuted,
  });

const nowEdge = (i: number) =>
  i === 0 ? { boxShadow: `inset 2px 0 0 ${T.accentRing}` } : null;

export const PeriodHeader = ({ periods, nameWidth, granularity }: Props) => (
  <div style={{ position: 'sticky', top: 0, zIndex: 2, background: T.headerBg }}>
    {granularity === 'week' && (
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ ...cornerStyle(nameWidth, 22), fontSize: 11, color: T.textFaint }}>
          Отдел
        </div>
        {monthBands(periods).map((b) => (
          <div
            key={b.key}
            style={{
              flex: b.span,
              minWidth: b.span * 56,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${T.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: T.textMuted,
              letterSpacing: '0.01em',
            }}
          >
            {b.label}
          </div>
        ))}
        {sigmaCell(22, '', true)}
      </div>
    )}

    <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderStrong}` }}>
      <div style={cornerStyle(nameWidth, 30)}>
        {granularity === 'month' ? 'Отдел' : 'Свободен с'}
      </div>
      {periods.map((p, i) => (
        <div
          key={p.key}
          style={{
            flex: 1,
            minWidth: 56,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${T.border}`,
            fontSize: 11.5,
            color: i === 0 ? T.text : T.textMuted,
            fontWeight: i === 0 ? 600 : 400,
            ...nowEdge(i),
          }}
        >
          {granularity === 'week' ? p.from.getUTCDate() : p.label}
        </div>
      ))}
      {sigmaCell(30, 'Σ гор.')}
    </div>
  </div>
);
