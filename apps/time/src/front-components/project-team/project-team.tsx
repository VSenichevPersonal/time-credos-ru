import { useSelectedRecordIds } from 'twenty-sdk/front-component';

import { T, FONT } from 'src/front-components/grid/tokens';
import { fmtHours } from 'src/front-components/grid/format';
import { Center } from 'src/front-components/grid/center';
import { useSortable } from 'src/front-components/shared/use-sortable';
import { SortHeader } from 'src/front-components/shared/sort-header';
import { useProjectTeam } from 'src/front-components/project-team/use-project-team';

type TeamSortKey = 'name' | 'hours' | 'entries' | 'last';

// Виджет вкладки «Команда» карточки проекта: таблица сотрудников, списывавших
// время на проект, с суммарными часами/долей/последней датой. Источник — записи
// трудозатрат проекта. Права/видимость — отдельно (бэклог).

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

export const ProjectTeam = () => {
  const ids = useSelectedRecordIds();
  const projectId = ids.length === 1 ? ids[0] : null;
  const { loading, error, members, total } = useProjectTeam(projectId);
  const { key: sortKey, dir, toggle, sort } = useSortable<TeamSortKey>('hours');

  if (error) return <Center>Не удалось загрузить команду: {error}</Center>;
  if (loading) return <Center>Загрузка команды…</Center>;
  if (members.length === 0) {
    return <Center>Никто ещё не списывал время на проект.</Center>;
  }

  const sorted = sort(members, (m) =>
    sortKey === 'name'
      ? m.name.toLowerCase()
      : sortKey === 'entries'
        ? m.entries
        : sortKey === 'last'
          ? m.lastDate ?? ''
          : m.hours,
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
          <SortHeader label="Сотрудник" active={sortKey === 'name'} dir={dir} onSort={() => toggle('name')} />
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
        {sorted.map((m, i) => (
          <div
            key={m.employeeId}
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              height: 34,
              borderBottom: `1px solid ${T.border}`,
              background: i % 2 === 1 ? T.rowAlt : 'transparent',
              fontSize: 12.5,
            }}
          >
            <span style={{ ...cell(), fontWeight: 500 }} title={m.name}>
              {m.name}
            </span>
            <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHours(m.hours)}</span>
            <span style={{ ...cell('right'), color: T.textMuted }}>
              {Math.round(m.share * 100)}%
            </span>
            <span style={{ ...cell('right'), color: T.textMuted }}>{m.entries}</span>
            <span style={{ ...cell('right'), color: T.textMuted }}>{fmtDate(m.lastDate)}</span>
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
        <span style={cell()}>Итого · {members.length} чел.</span>
        <span style={cell('right')}>{fmtHours(total)}</span>
        <span style={cell('right')} />
        <span style={cell('right')} />
        <span style={cell('right')} />
      </div>
    </div>
  );
};
