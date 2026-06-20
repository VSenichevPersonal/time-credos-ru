import { T } from 'src/front-components/reports/report-tokens';
import { fmtHrs } from 'src/front-components/reports/report-tokens';
import type { CategoryShare } from 'src/front-components/reports/report-types';

// Мини stacked-bar долей категорий работ внутри строки (отдел/человек/проект).
// Палитра Restrained: клиент = акцент, остальное — холодные нейтрали-тинты,
// OTHER — серый. Порядок/цвет ФИКСИРОВАНЫ по словарю (контракт §byCategory:
// не сортировать цвета по hours, иначе «прыгают» между строками).
// Tooltip — нативный title (НЕ host-DOM): названия категорий + часы + доли.

type CatMeta = { label: string; color: string };

// Бэкенд отдаёт UPPER_CASE коды. Цвет: один акцент (клиент), прочие — тинты.
const CATS: Record<string, CatMeta> = {
  CLIENT: { label: 'На клиента', color: T.accent },
  PRESALE: { label: 'Пресейл', color: '#8aa0c8' },
  PILOT: { label: 'Пилот', color: '#a9b6cf' },
  INTERNAL: { label: 'Внутренний', color: '#c2c7d2' },
  INFRASTRUCTURE: { label: 'Инфраструктура', color: '#d2d6de' },
  TRAINING: { label: 'Обучение', color: '#b9c4d6' },
  OTHER: { label: 'Прочее', color: '#cdd0d7' },
};

// Стабильный порядок сегментов (клиент первым, прочее последним).
const ORDER = [
  'CLIENT',
  'PRESALE',
  'PILOT',
  'INTERNAL',
  'INFRASTRUCTURE',
  'TRAINING',
  'OTHER',
];

const meta = (code: string): CatMeta =>
  CATS[code] ?? { label: code, color: '#cdd0d7' };

// Доля в процентах (1 знак, без дробного «.0»).
const pct = (share: number | null): string => {
  if (share === null) return '—';
  const v = share * 100;
  return (Math.round(v * 10) / 10).toString().replace('.', ',');
};

type Props = {
  parts: CategoryShare[];
  height?: number;
};

export const CategoryBar = ({ parts, height = 8 }: Props) => {
  // Graceful: пусто (fact==0) → бар не рисуем.
  if (!parts || parts.length === 0) {
    return <span style={{ color: T.textFaint, fontSize: 11 }}>—</span>;
  }

  // Стабильный порядок сегментов по словарю (цвета не прыгают между строками).
  const ordered = [...parts].sort(
    (a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category),
  );

  // Нативный tooltip: «На клиента — 184 ч · 62%».
  const tip = ordered
    .map((p) => `${meta(p.category).label} — ${fmtHrs(p.hours)} ч · ${pct(p.share)}%`)
    .join('\n');

  return (
    <span
      title={tip}
      style={{
        display: 'flex',
        width: '100%',
        height,
        borderRadius: height,
        overflow: 'hidden',
        background: T.headerBg,
        cursor: 'default',
      }}
    >
      {ordered.map((p) => {
        const w = p.share === null ? 0 : Math.max(0, p.share * 100);
        if (w <= 0) return null;
        return (
          <span
            key={p.category}
            style={{ width: `${w}%`, height: '100%', background: meta(p.category).color }}
          />
        );
      })}
    </span>
  );
};

// Компактная легенда категорий (под таблицей): фикс. порядок, только встреченные.
export const CategoryLegend = ({ present }: { present: Set<string> }) => {
  const items = ORDER.filter((c) => present.has(c));
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 14px',
        padding: '8px 12px',
        borderTop: `1px solid ${T.border}`,
        fontSize: 11.5,
        color: T.textMuted,
        background: T.headerBg,
      }}
    >
      {items.map((c) => (
        <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: meta(c).color,
              flex: '0 0 auto',
            }}
          />
          {meta(c).label}
        </span>
      ))}
    </div>
  );
};
