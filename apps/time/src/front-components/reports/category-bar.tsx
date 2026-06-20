import { T, fmtHrs } from 'src/front-components/reports/report-tokens';
import { categoryMeta, CATEGORY_ORDER } from 'src/front-components/shared/category-meta';
import type { CategoryShare } from 'src/front-components/reports/report-types';

// Мини stacked-bar долей категорий внутри строки агрегата (отдел/человек/итого).
// Ярлыки/цвета/порядок — ДИНАМИЧЕСКИ из справочника (shared/category-meta, SSOT
// WORK_CATEGORY_OPTIONS). Никакого хардкода категорий. Tooltip — нативный title.

// Доля в процентах (1 знак, без дробного «.0»).
const pct = (share: number | null): string => {
  if (share === null) return '—';
  const v = share * 100;
  return (Math.round(v * 10) / 10).toString().replace('.', ',');
};

const orderOf = (code: string): number => {
  const i = CATEGORY_ORDER.indexOf(code);
  return i === -1 ? 999 : i;
};

type Props = {
  parts: CategoryShare[];
  height?: number;
};

export const CategoryBar = ({ parts, height = 8 }: Props) => {
  if (!parts || parts.length === 0) {
    return <span style={{ color: T.textFaint, fontSize: 11 }}>—</span>;
  }

  // Стабильный порядок сегментов по справочнику (цвета не прыгают между строк).
  const ordered = [...parts].sort((a, b) => orderOf(a.category) - orderOf(b.category));

  const tip = ordered
    .map((p) => `${categoryMeta(p.category).label} — ${fmtHrs(p.hours)} ч · ${pct(p.share)}%`)
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
            style={{ width: `${w}%`, height: '100%', background: categoryMeta(p.category).solid }}
          />
        );
      })}
    </span>
  );
};

// Чип категории — для строк ПРОЕКТА (проект = одна категория, стек бессмыслен).
export const CategoryChip = ({ category }: { category: string | null }) => {
  if (!category) return <span style={{ color: T.textFaint, fontSize: 11 }}>—</span>;
  const m = categoryMeta(category);
  return (
    <span
      title={m.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: '100%',
        padding: '2px 9px',
        borderRadius: 12,
        background: m.tint,
        fontSize: 11.5,
        fontWeight: 500,
        color: T.text,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.solid, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
    </span>
  );
};

// Легенда категорий (под таблицей): порядок справочника, только встреченные.
export const CategoryLegend = ({ present }: { present: Set<string> }) => {
  const items = CATEGORY_ORDER.filter((c) => present.has(c));
  for (const c of present) if (!items.includes(c)) items.push(c); // вне справочника (OTHER) — в конец
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
              background: categoryMeta(c).solid,
              flex: '0 0 auto',
            }}
          />
          {categoryMeta(c).label}
        </span>
      ))}
    </div>
  );
};
