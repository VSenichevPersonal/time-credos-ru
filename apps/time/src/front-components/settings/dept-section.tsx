import { T } from 'src/front-components/grid/tokens';
import { departmentLabel } from 'src/constants/labels';
import { NumField } from 'src/front-components/settings/num-field';
import type { DeptPatch } from 'src/front-components/settings/settings-rest';
import type { DeptSettings, Headcounts } from 'src/front-components/settings/types';

// Таблица отделов: согласование (тоггл) · коэффициент ёмкости · численность.
// Согласование/коэффициент — inline-правка → PATCH (оптимистично). Численность —
// read-only (вычисляется по активным сотрудникам, не заносится вручную).

type Props = {
  depts: DeptSettings[];
  headcounts: Headcounts; // deptId → активных сотрудников (вычислено)
  onUpdate: (id: string, patch: DeptPatch) => void;
};

// Read-only бейдж численности (вычислено по сотрудникам), tabular-nums.
const HeadcountBadge = ({ value }: { value: number }) => (
  <span
    title="Активные сотрудники отдела (вычисляется)"
    style={{
      minWidth: 40,
      textAlign: 'center',
      padding: '3px 8px',
      fontSize: 12.5,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      borderRadius: 6,
      color: T.textMuted,
      background: T.panelBg,
    }}
  >
    {value}
  </span>
);

const COLS = '1fr 132px 120px 96px';

const head: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COLS,
  alignItems: 'center',
  height: 32,
  padding: '0 4px',
  borderBottom: `1px solid ${T.borderStrong}`,
  fontSize: 11.5,
  fontWeight: 600,
  color: T.textMuted,
};

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={onClick}
    style={{
      height: 24,
      padding: '0 10px',
      fontSize: 11.5,
      fontWeight: 600,
      border: `1px solid ${on ? T.accentRing : T.borderStrong}`,
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'inherit',
      color: on ? T.accent : T.textMuted,
      background: on ? T.accentSoft : T.surface,
    }}
  >
    {on ? 'Включено' : 'Выключено'}
  </button>
);

export const DeptSection = ({ depts, headcounts, onUpdate }: Props) => (
  <div>
    <div style={head}>
      <span style={{ paddingLeft: 6 }}>Отдел</span>
      <span>Согласование</span>
      <span>Коэф. ёмкости</span>
      <span
        title="Активные сотрудники отдела (вычисляется)"
        style={{ textAlign: 'right', paddingRight: 8 }}
      >
        Числ.
      </span>
    </div>
    {depts.map((d) => (
      <div
        key={d.id}
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          alignItems: 'center',
          height: 44,
          padding: '0 4px',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <span
          title={d.code ? departmentLabel(d.code) : d.name}
          style={{ paddingLeft: 6, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {d.code ? departmentLabel(d.code, { short: true }) : d.name}
        </span>
        <Toggle on={d.approvalRequired} onClick={() => onUpdate(d.id, { approvalRequired: !d.approvalRequired })} />
        <NumField value={d.capacityFactor} min={0} width={76} onCommit={(v) => onUpdate(d.id, { capacityFactor: v })} />
        <span style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 8 }}>
          <HeadcountBadge value={headcounts[d.id] ?? 0} />
        </span>
      </div>
    ))}
  </div>
);
