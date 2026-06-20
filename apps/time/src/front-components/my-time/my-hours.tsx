import { T } from 'src/front-components/grid/tokens';
import { fmtHrs, fmtUtil, fmtUnder, underTone } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { ErrorState } from 'src/front-components/shared/error-state';
import { usePeriod, type PeriodGran } from 'src/front-components/reports/use-period';
import { useReports } from 'src/front-components/reports/use-reports';
import { useMyHours } from 'src/front-components/my-time/use-my-hours';
import { Bar } from 'src/front-components/reports/bar';
import type { EmployeeRow, ReportRow } from 'src/front-components/reports/report-types';

// REQ-0014 «Мои часы»: факт/норма/недогруз/утилизация ТЕКУЩЕГО юзера за период
// + разбивка по проектам и категориям. KPI и категории — из /s/reports
// byEmployee (фильтр self клиентом, т.к. сервис считает всех). Состав по
// проектам — из записей юзера (useMyHours). Переключатель месяц/квартал/год.

const EMPTY_ROW: ReportRow = {
  key: 'self',
  name: '',
  fact: 0,
  client: 0,
  norm: null,
  util: null,
  under: null,
  byCategory: [],
};

const Card = ({ label, value, hint, color }: { label: string; value: string; hint?: string; color?: string }) => (
  <div style={{ flex: '1 1 130px', minWidth: 130, padding: '12px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
    <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: color ?? T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {hint && <div style={{ fontSize: 11, color: T.textFaint, marginTop: 6 }}>{hint}</div>}
  </div>
);

const Header = ({
  label,
  isCurrent,
  gran,
  onPrev,
  onNext,
  onGran,
}: {
  label: string;
  isCurrent: boolean;
  gran: PeriodGran;
  onPrev: () => void;
  onNext: () => void;
  onGran: (g: PeriodGran) => void;
}) => {
  const btn = (disabled: boolean) =>
    ({ width: 28, height: 28, border: `1px solid ${T.border}`, borderRadius: 7, background: T.surface, color: disabled ? T.textFaint : T.textMuted, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14 }) as const;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: T.panelBg, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <button aria-label="Предыдущий период" onClick={onPrev} style={btn(false)}>‹</button>
        <span style={{ minWidth: 130, textAlign: 'center', fontSize: 13, fontWeight: 600, color: T.text }}>{label}</span>
        <button aria-label="Следующий период" onClick={isCurrent ? undefined : onNext} disabled={isCurrent} style={btn(isCurrent)}>›</button>
      </span>
      <Segmented
        ariaLabel="Гранулярность периода"
        value={gran}
        segments={[{ value: 'month', label: 'Месяц' }, { value: 'quarter', label: 'Квартал' }, { value: 'year', label: 'Год' }]}
        onChange={(g: PeriodGran) => onGran(g)}
      />
    </div>
  );
};

export const MyHours = ({ employeeId }: { employeeId: string }) => {
  const { period, gran, isCurrent, prev, next, setGran } = usePeriod();
  const reports = useReports(period.from, period.to, 'employee');
  const hours = useMyHours(employeeId, period.from, period.to);

  // Моя строка из byEmployee (сервис считает всех — фильтруем self клиентом).
  const me: ReportRow =
    (reports.data?.byEmployee ?? []).find((r: EmployeeRow) => r.key === employeeId) ?? EMPTY_ROW;
  const under = underTone(me.under);
  const maxProj = Math.max(1, ...hours.byProject.map((p) => p.hours));

  if (reports.error)
    return <ErrorState title="Не удалось загрузить мои часы" detail={reports.error} onRetry={reports.reload} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Header label={period.label} isCurrent={isCurrent} gran={gran} onPrev={prev} onNext={next} onGran={(g) => setGran(g)} />

      {reports.loading ? (
        <Center>Загрузка часов…</Center>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 14px' }}>
            <Card label="Факт, ч" value={fmtHrs(me.fact)} hint="списано за период" />
            <Card label="Норма, ч" value={me.norm === null ? '—' : fmtHrs(me.norm)} hint="по произв. календарю" />
            <Card label="Недогруз, ч" value={fmtUnder(me.under)} hint={me.under !== null && me.under < 0 ? 'перегруз' : 'до нормы'} color={under.fg} />
            <Card label="Утилизация" value={fmtUtil(me.util)} hint="доля клиентских часов" color={T.accent} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, margin: '0 14px 14px', border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', background: T.surface }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, color: T.textMuted }}>
              По проектам
            </div>
            {hours.error ? (
              <ErrorState title="Не удалось загрузить разбивку" detail={hours.error} />
            ) : hours.loading ? (
              <Center>Загрузка проектов…</Center>
            ) : hours.byProject.length === 0 ? (
              <Center>За период нет записей. Внесите трудозатраты на странице «Записи».</Center>
            ) : (
              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {hours.byProject.map((p, i) => (
                  <div key={p.projectId} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 72px', alignItems: 'center', gap: 10, height: 40, padding: '0 14px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.rowAlt : 'transparent', fontSize: 12.5 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={p.name}>{p.name}</span>
                    <Bar value={p.hours} max={maxProj} />
                    <span style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtHrs(p.hours)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
