import { useSelectedRecordIds } from 'twenty-sdk/front-component';

import { T, FONT } from 'src/front-components/grid/tokens';
import { fmtHours } from 'src/front-components/grid/format';
import { Center } from 'src/front-components/grid/center';
import { useSortable } from 'src/front-components/shared/use-sortable';
import { SortHeader } from 'src/front-components/shared/sort-header';
import { useEmployeeProjects } from 'src/front-components/project-team/use-employee-projects';

type Sort = 'name' | 'hours' | 'entries' | 'last';

// Виджет вкладки «Проекты» карточки сотрудника (#5-часть2): проекты, где сотрудник
// списывал время, с часами/долей/последней датой. Источник — /s/project-team
// (mode=employee-projects). Record-scoped через useSelectedRecordIds.

const fmtDate = (iso: string | null): string =>
  iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '—';

const COLS = '1fr 72px 64px 64px 92px';

const cell = (align: 'left' | 'right' = 'left') =>
  ({
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums' as const,
  }) as const;

const projectLabel = (code: string | null, name: string): string =>
  code ? `${code} · ${name}` : name;

export const EmployeeProjects = () => {
  const ids = useSelectedRecordIds();
  const employeeId = ids.length === 1 ? ids[0] : null;
  const { loading, error, projects, total } = useEmployeeProjects(employeeId);
  const { key: sortKey, dir, toggle, sort } = useSortable<Sort>('hours');

  if (error) return <Center>Не удалось загрузить проекты: {error}</Center>;
  if (loading) return <Center>Загрузка проектов…</Center>;
  if (projects.length === 0) {
    return <Center>Сотрудник ещё не списывал время на проекты.</Center>;
  }

  const sorted = sort(projects, (p) =>
    sortKey === 'name'
      ? projectLabel(p.code, p.name).toLowerCase()
      : sortKey === 'entries'
        ? p.entries
        : sortKey === 'last'
          ? p.lastDate ?? ''
          : p.hours,
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          height: 34,
          borderBottom: `1px solid ${T.borderStrong}`,
          background: T.headerBg,
          fontSize: 11.5,
          fontWeight: 600,
          color: T.textMuted,
          position: 'sticky',
          top: 0,
        }}
      >
        <span style={cell()}>
          <SortHeader label="Проект" active={sortKey === 'name'} dir={dir} onSort={() => toggle('name')} />
        </span>
        <span style={cell('right')}>
          <SortHeader label="Часов" align="right" active={sortKey === 'hours'} dir={dir} onSort={() => toggle('hours')} />
        </span>
        <span style={cell('right')}>Доля</span>
        <span style={cell('right')}>
          <SortHeader label="Записей" align="right" active={sortKey === 'entries'} dir={dir} onSort={() => toggle('entries')} />
        </span>
        <span style={cell('right')}>
          <SortHeader label="Последняя" align="right" active={sortKey === 'last'} dir={dir} onSort={() => toggle('last')} />
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {sorted.map((p, i) => (
          <div
            key={p.projectId}
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              height: 34,
              borderBottom: `1px solid ${T.border}`,
              background: i % 2 === 1 ? T.rowAlt : 'transparent',
              fontSize: 12.5,
            }}
          >
            <span style={{ ...cell(), fontWeight: 500 }} title={projectLabel(p.code, p.name)}>
              {projectLabel(p.code, p.name)}
            </span>
            <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHours(p.hours)}</span>
            <span style={{ ...cell('right'), color: T.textMuted }}>{Math.round(p.share * 100)}%</span>
            <span style={{ ...cell('right'), color: T.textMuted }}>{p.entries}</span>
            <span style={{ ...cell('right'), color: T.textMuted }}>{fmtDate(p.lastDate)}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          height: 34,
          borderTop: `1px solid ${T.borderStrong}`,
          background: T.panelBg,
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        <span style={cell()}>Итого · {projects.length} проект.</span>
        <span style={cell('right')}>{fmtHours(total)}</span>
        <span style={cell('right')} />
        <span style={cell('right')} />
        <span style={cell('right')} />
      </div>
    </div>
  );
};
