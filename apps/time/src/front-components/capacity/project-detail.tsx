import { T } from 'src/front-components/capacity/cap-tokens';
import type {
  CapProject,
  Period,
  ProjectLoad,
} from 'src/front-components/capacity/types';

// Раскрытие отдела (режим «Детализация»): проекты, формирующие загрузку, с их
// вкладом по периодам, и секция «без плана» (риск недоучёта).

type Props = {
  planned: ProjectLoad[];
  unplanned: CapProject[];
  periods: Period[];
  nameWidth: number;
};

// UX-5: name уже содержит «КОД · Клиент · Название» — показываем как есть,
// без повторного префикса code (иначе дубль кода в строке).
const title = (p: CapProject): string => p.name;

const cellNum = (v: number): string =>
  v > 0 ? String(Math.round(v)) : '';

export const ProjectDetail = ({ planned, unplanned, periods, nameWidth }: Props) => (
  <div style={{ background: T.rowAlt }}>
    {planned.map(({ project, perPeriod }) => (
      <div key={project.id} style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
        <div
          style={{
            width: nameWidth,
            minWidth: nameWidth,
            padding: '0 12px 0 28px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            borderRight: `1px solid ${T.border}`,
            background: T.rowAlt,
            fontSize: 12,
            color: T.textMuted,
            position: 'sticky',
            left: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={title(project)}
        >
          {title(project)}
        </div>
        {periods.map((p, i) => (
          <div
            key={p.key}
            style={{
              flex: 1,
              minWidth: 56,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${T.border}`,
              fontSize: 11.5,
              color: perPeriod[i] > 0 ? T.text : T.textFaint,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {cellNum(perPeriod[i])}
          </div>
        ))}
      </div>
    ))}

    {unplanned.length > 0 && (
      <div
        style={{
          padding: '6px 12px 6px 28px',
          fontSize: 11.5,
          color: T.textFaint,
          borderBottom: `1px solid ${T.border}`,
          background: T.rowAlt,
        }}
      >
        Без плана ({unplanned.length}):{' '}
        {unplanned.map((p) => p.code ?? p.name).join(', ')}
      </div>
    )}

    {planned.length === 0 && unplanned.length === 0 && (
      <div
        style={{
          padding: '6px 12px 6px 28px',
          fontSize: 11.5,
          color: T.textFaint,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        Нет проектов в горизонте
      </div>
    )}
  </div>
);
