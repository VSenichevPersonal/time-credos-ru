import { useSelectedRecordIds } from 'twenty-sdk/front-component';

import { T, FONT } from 'src/front-components/grid/tokens';
import { fmtHours } from 'src/front-components/grid/format';
import { Center } from 'src/front-components/grid/center';
import { CategoryChip } from 'src/front-components/reports/category-bar';
import { PROJECT_STATUS_OPTIONS } from 'src/constants/select-options';
import { useSummary } from 'src/front-components/project-summary/use-summary';

// Вкладка «Сводка» карточки проекта: ключевое в одном экране — статус/категория,
// бюджет (план/факт/остаток), команда, этапы, период, последняя активность.

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  PROJECT_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const fmtDate = (iso: string | null): string =>
  iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '—';

const card: React.CSSProperties = {
  flex: '1 1 150px',
  minWidth: 150,
  padding: '12px 14px',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  background: T.surface,
};

const Kpi = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div style={card}>
    <div style={{ fontSize: 11.5, color: T.textMuted }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2 }}>{sub}</div>}
  </div>
);

export const ProjectSummary = () => {
  const ids = useSelectedRecordIds();
  const projectId = ids.length === 1 ? ids[0] : null;
  const { loading, error, data } = useSummary(projectId);

  if (error) return <Center>Не удалось загрузить сводку: {error}</Center>;
  if (loading) return <Center>Загрузка сводки…</Center>;
  if (!data) return <Center>Откройте карточку проекта.</Center>;

  const planned = data.plannedEffort;
  const rest = planned ? planned - data.fact : null;
  const ratio = planned && planned > 0 ? data.fact / planned : 0;
  const over = ratio > 1;

  return (
    <div style={{ height: '100%', overflow: 'auto', background: T.bg, fontFamily: FONT, color: T.text, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.code ?? data.name}</span>
        {data.code && data.name && <span style={{ fontSize: 13, color: T.textMuted }}>{data.name}</span>}
        <CategoryChip category={data.category} />
        {data.status && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textMuted, padding: '2px 9px', borderRadius: 12, background: T.panelBg }}>
            {STATUS_LABEL[data.status] ?? data.status}
          </span>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, color: T.textMuted }}>Бюджет · план vs факт</div>
        <div style={{ marginTop: 6, height: 10, borderRadius: 10, background: T.headerBg, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, Math.round(ratio * 100))}%`, height: '100%', background: over ? T.over : T.accent }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
          Факт <b>{fmtHours(data.fact)}</b> из {planned ? fmtHours(planned) : '—'} ч ·{' '}
          {rest === null ? 'плана нет' : rest < 0 ? <span style={{ color: T.over }}>перерасход {fmtHours(-rest)} ч</span> : <span style={{ color: T.ok }}>остаток {fmtHours(rest)} ч</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <Kpi label="Всего часов" value={fmtHours(data.fact)} sub={`${data.entries} записей`} />
        <Kpi label="Команда" value={String(data.team)} sub="сотрудников" />
        <Kpi label="Этапов" value={String(data.stages)} />
        <Kpi label="Период" value={fmtDate(data.startDate)} sub={`по ${fmtDate(data.endDate)}`} />
        <Kpi label="Последняя активность" value={fmtDate(data.lastDate)} />
      </div>
    </div>
  );
};
