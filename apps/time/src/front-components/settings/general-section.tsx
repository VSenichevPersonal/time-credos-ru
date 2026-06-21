import { T } from 'src/front-components/grid/tokens';
import {
  APPROVAL_PERIOD_OPTIONS,
  DAY_OF_WEEK_OPTIONS,
  WEEK_STARTS_ON_OPTIONS,
} from 'src/constants/select-options';
import { SelectField, Toggle } from 'src/front-components/settings/field-controls';
import { NumField } from 'src/front-components/settings/num-field';
import type { GlobalPatch } from 'src/front-components/settings/settings-rest';
import type { GlobalSettings } from 'src/front-components/settings/types';

// REQ-0019 — «Общие параметры»: форма из 12 полей глобального singleton
// (credosTimeSettings), сгруппированных по смыслу. Inline-правка → PATCH
// (оптимистично, откат в use-settings). Сверка с Timetta system-settings:
// норма/расписание, периоды таймшитов, шаблон заполнения, напоминания.

type Props = {
  settings: GlobalSettings;
  onUpdate: (patch: GlobalPatch) => void;
};

// Строка «лейбл (+подсказка) → контрол». Подсказка снимает неоднозначность
// без отдельной справки; контрол прижат вправо, единая высота строк.
const Row = ({
  label,
  hint,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: 16,
      minHeight: 48,
      padding: '6px 10px',
      borderBottom: `1px solid ${T.border}`,
      background: warn ? T.overSoft : 'transparent',
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: warn ? T.over : T.text }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2 }}>{hint}</div>
      )}
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
  </div>
);

// Подзаголовок группы параметров. Рубленый ритм между группами.
const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 14 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: T.textMuted,
        padding: '0 10px 6px',
      }}
    >
      {title}
    </div>
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.surface }}>
      {children}
    </div>
  </div>
);

export const GeneralSection = ({ settings: s, onUpdate }: Props) => (
  <div>
    <Group title="Ввод">
      <Row label="Норма часов в день" hint="Базовая дневная норма (fallback расчёта загрузки).">
        <NumField value={s.normHoursPerDay} min={0} onCommit={(v) => onUpdate({ normHoursPerDay: v })} />
      </Row>
      <Row label="Порог переработки (ч/день)" hint="Выше — предупреждение в таймшите.">
        <NumField value={s.overtimeWarnHours} min={0} onCommit={(v) => onUpdate({ overtimeWarnHours: v })} />
      </Row>
      <Row label="Часы шаблона заполнения" hint="Заполняет день при «авто-заполнении».">
        <NumField value={s.fillTemplateHours} min={0} onCommit={(v) => onUpdate({ fillTemplateHours: v })} />
      </Row>
      <Row label="Начало недели">
        <SelectField value={s.weekStartsOn} options={WEEK_STARTS_ON_OPTIONS} onChange={(v) => onUpdate({ weekStartsOn: v })} />
      </Row>
    </Group>

    <Group title="Планирование">
      <Row label="Горизонт планирования (недель)" hint="Глубина доски планирования вперёд.">
        <NumField value={s.planningHorizonWeeks} min={1} onCommit={(v) => onUpdate({ planningHorizonWeeks: v })} />
      </Row>
      <Row label="Коэффициент ёмкости по умолчанию" hint="Доля рабочего времени за вычетом накладных.">
        <NumField value={s.defaultCapacityFactor} min={0} onCommit={(v) => onUpdate({ defaultCapacityFactor: v })} />
      </Row>
      <Row label="Пресейл-бронь в планировании" hint="Учитывать предварительные брони в загрузке.">
        <Toggle on={s.tentativeBookingEnabled} onChange={(v) => onUpdate({ tentativeBookingEnabled: v })} />
      </Row>
    </Group>

    <Group title="Согласование">
      <Row label="Согласование по умолчанию" hint="Дефолт для новых отделов.">
        <Toggle on={s.defaultApprovalRequired} onChange={(v) => onUpdate({ defaultApprovalRequired: v })} />
      </Row>
      <Row label="Период согласования">
        <SelectField value={s.approvalPeriod} options={APPROVAL_PERIOD_OPTIONS} onChange={(v) => onUpdate({ approvalPeriod: v })} />
      </Row>
    </Group>

    <Group title="Напоминания">
      <Row label="Напоминать заполнить таймшит">
        <Toggle on={s.reminderEnabled} onChange={(v) => onUpdate({ reminderEnabled: v })} />
      </Row>
      <Row label="День напоминания">
        <SelectField value={s.reminderDayOfWeek} options={DAY_OF_WEEK_OPTIONS} onChange={(v) => onUpdate({ reminderDayOfWeek: v })} />
      </Row>
    </Group>

    <Group title="Безопасность">
      <Row
        label="Показывать ФИО в отчётах"
        hint="ПДн (152-ФЗ): осторожно. Включайте только при доверенном доступе к отчётам."
        warn
      >
        <Toggle on={s.revealEmployeeNames} onChange={(v) => onUpdate({ revealEmployeeNames: v })} labels={['Видны', 'Скрыты']} />
      </Row>
    </Group>
  </div>
);
