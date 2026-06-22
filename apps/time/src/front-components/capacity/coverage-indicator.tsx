import { T } from 'src/front-components/capacity/cap-tokens';
import { coverageLabel, type PlanCoverage } from 'src/front-components/capacity/plan-preview';

// Индикатор «распланировано X / Y ч (Z%)» — стыковка распределения (Σслотов, X) с
// плановой трудоёмкостью-бюджетом (plannedEffort, Y). Заказчик: показать остаток
// (Y−X), ✓ когда всё распланировано, terracotta-warning при переаллокации (X>Y,
// «сверх бюджета +N ч», НЕ блок — предупреждение). Разведка Float/Runn/Timetta:
// over-budget = красный бар, не блокировка (см. PLAN_VS_BUDGET_COVERAGE §2-3).
// impeccable: tabular-nums, дублирование не-цветом (✓/⚠), AA-контраст, бренд-индиго.
//
// Два варианта рендера: compact (строка проекта — одна линия) и full (панель — с
// прогресс-баром). Бюджет не задан → не рисуем (нечего сверять).

const tnum = { fontVariantNumeric: 'tabular-nums' as const };
const r0 = (n: number): number => Math.round(n);

type Tone = { bar: string; ink: string; tint: string; mark: string };

// Тон по состоянию coverage: переаллокация — терракот (как overbooking),
// «всё распланировано» — зелёный ✓, в процессе — бренд-индиго.
const toneOf = (c: PlanCoverage): Tone => {
  if (c.over > 0) return { bar: T.over, ink: T.over, tint: T.overSoft, mark: '⚠' };
  if (c.full) return { bar: T.ok, ink: T.ok, tint: T.okSoft, mark: '✓' };
  return { bar: T.accent, ink: T.textMuted, tint: T.accentSoft, mark: '' };
};

type Props = {
  coverage: PlanCoverage;
  variant?: 'compact' | 'full';
};

export const CoverageIndicator = ({ coverage, variant = 'full' }: Props) => {
  if (!coverage.hasBudget) return null;
  const tone = toneOf(coverage);
  const label = coverageLabel(coverage);
  // Бар: доля распланированного (0..100). При переаллокации заполнен на 100%
  // (бюджет покрыт) — «сверх» выражается цветом и подписью, а не >100% шириной.
  const fillPct = Math.max(0, Math.min(100, Math.round(coverage.pct * 100)));

  if (variant === 'compact') {
    // Строка проекта: компактно, одна линия. «X / Y ч · Z% · осталось N» или
    // «сверх бюджета +N ч» / «✓». Терракот при over, зелёный при full.
    return (
      <span
        title={label}
        aria-label={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          color: tone.ink,
          whiteSpace: 'nowrap',
          ...tnum,
        }}
      >
        {tone.mark && <span aria-hidden="true">{tone.mark}</span>}
        <span>
          {r0(coverage.allocated)} / {r0(coverage.budget)} ч
        </span>
        <span style={{ color: T.textFaint }}>·</span>
        {coverage.over > 0 ? (
          <span style={{ color: T.over }}>сверх +{r0(coverage.over)} ч</span>
        ) : coverage.full ? (
          <span style={{ color: T.ok }}>всё</span>
        ) : (
          <span style={{ color: T.textMuted }}>осталось {r0(coverage.remaining)} ч</span>
        )}
      </span>
    );
  }

  // Панель: подпись + прогресс-бар + остаток/over под ним.
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        background: tone.tint,
        border: `1px solid ${coverage.over > 0 ? T.overBorder : T.border}`,
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
          fontSize: 11.5,
          marginBottom: 6,
        }}
      >
        <span style={{ color: T.textMuted }}>Распланировано</span>
        <span style={{ color: tone.ink, fontWeight: 600, ...tnum }}>
          {tone.mark && <span aria-hidden="true">{tone.mark} </span>}
          {r0(coverage.allocated)} / {r0(coverage.budget)} ч · {Math.round(coverage.pct * 100)}%
        </span>
      </div>
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          height: 6,
          background: T.headerBg,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${fillPct}%`,
            height: '100%',
            background: tone.bar,
            borderRadius: 3,
          }}
        />
      </span>
      <div style={{ fontSize: 11, color: tone.ink, marginTop: 6, ...tnum }}>
        {coverage.over > 0
          ? `Сверх бюджета +${r0(coverage.over)} ч — предупреждение, можно сохранить`
          : coverage.full
            ? 'Всё распланировано'
            : `Осталось распределить ${r0(coverage.remaining)} ч`}
      </div>
    </div>
  );
};
