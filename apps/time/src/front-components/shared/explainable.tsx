import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Объяснимое число (DP-0002): пунктир-подчёркивание + поповер «как считается».
// Наведение/клик → формула + состав (строки, что суммируются) + опц. drill.
// DOM-free (Web Worker, нет host-DOM): направление — структурный проп `up`,
// без замеров. См. docs/design/UI_PLAYBOOK.md §0 + FRONT_COMPONENT_RECIPES.md.

export type ExplainPart = {
  label: string;
  value: string; // уже форматированное (часы/%/…)
  share?: number; // 0..1 — доля, рисуем мини-бар
  color?: string; // цвет сегмента/категории
};

type Props = {
  children: React.ReactNode; // само число
  title: string; // что за число
  formula?: string; // напр. «клиент / факт = 120 / 247»
  parts?: ExplainPart[]; // состав
  up?: boolean; // открывать поповер вверх (у нижней кромки виджета)
  align?: 'left' | 'right';
  block?: boolean; // тянуть на всю ширину ячейки (для inline-баров: stacked-bar категорий)
};

export const Explainable = ({ children, title, formula, parts, up, align = 'left', block }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: block ? 'flex' : 'inline-flex', width: block ? '100%' : undefined }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          cursor: 'help',
          ...(block
            ? { width: '100%', display: 'flex', alignItems: 'center' }
            : { textDecoration: 'underline dotted', textUnderlineOffset: 2, textDecorationColor: T.textFaint }),
        }}
      >
        {children}
      </button>

      {open && (formula || (parts && parts.length > 0)) && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            zIndex: 20,
            minWidth: 220,
            maxWidth: 320,
            maxHeight: 260,
            overflowY: 'auto',
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 9,
            boxShadow: '0 8px 24px rgba(29,31,38,0.16)',
            padding: 10,
            textAlign: 'left',
            cursor: 'default',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </div>
          {formula && (
            <div style={{ marginTop: 4, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: T.text }}>
              {formula}
            </div>
          )}
          {parts && parts.length > 0 && (
            <div style={{ marginTop: formula ? 8 : 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {parts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: p.color ?? T.accentSoft,
                    }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.textMuted }}>
                    {p.label}
                  </span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: T.text }}>
                    {p.value}
                  </span>
                  {p.share !== undefined && (
                    <span style={{ width: 38, textAlign: 'right', fontSize: 11, color: T.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(p.share * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
};
