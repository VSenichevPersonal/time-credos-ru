import { useSelectedRecordIds } from 'twenty-sdk/front-component';

import { T, FONT } from 'src/front-components/reports/report-tokens';
import { fmtHrs } from 'src/front-components/reports/report-tokens';
import { Bar, pctOfNorm } from 'src/front-components/reports/bar';
import { Center } from 'src/front-components/grid/center';
import { useProjectBudget } from 'src/front-components/project-budget/use-project-budget';

// Виджет вкладки «Бюджет» карточки проекта: план (plannedEffort) vs факт
// (Σ часов проекта из /s/reports byProject). Прогресс-бар + алерт превышения.

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div style={{ flex: '1 1 120px', minWidth: 120 }}>
    <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 4 }}>{label}</div>
    <div
      style={{ fontSize: 22, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </div>
  </div>
);

export const ProjectBudget = () => {
  const ids = useSelectedRecordIds();
  const projectId = ids.length === 1 ? ids[0] : null;
  const { loading, error, row } = useProjectBudget(projectId);

  if (error) return <Center>Не удалось загрузить бюджет: {error}</Center>;
  if (loading) return <Center>Загрузка бюджета…</Center>;

  const planned = row?.plannedEffort ?? null;
  const fact = row?.fact ?? 0;
  const used = row?.budgetUsed ?? null; // факт/план (null если плана нет)
  const over = used !== null && used > 1;
  const remaining = planned !== null ? planned - fact : null;

  return (
    <div
      style={{
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'auto',
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 18,
          maxWidth: 560,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          План vs факт
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <Metric label="План, ч" value={planned === null ? '—' : fmtHrs(planned)} />
          <Metric label="Факт, ч" value={fmtHrs(fact)} />
          <Metric
            label="Осталось, ч"
            value={remaining === null ? '—' : fmtHrs(Math.max(0, remaining))}
          />
        </div>

        {planned === null ? (
          <div style={{ fontSize: 12.5, color: T.textMuted }}>
            Плановые часы проекта не заданы — сравнение недоступно. Укажите{' '}
            <b>плановую трудоёмкость</b> в реквизитах проекта.
          </div>
        ) : (
          <>
            <Bar value={fact} max={planned} height={12} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontSize: 12,
                color: T.textMuted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>Выработка: {pctOfNorm(fact, planned)}</span>
              <span>{fmtHrs(fact)} / {fmtHrs(planned)} ч</span>
            </div>

            {over && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: T.overSoft,
                  color: T.over,
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                Превышение плана на {fmtHrs(fact - planned)} ч (
                {Math.round((used - 1) * 100)}% сверх плана).
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
