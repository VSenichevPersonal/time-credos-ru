import { useEffect, useMemo, useState } from 'react';

import { T } from 'src/front-components/capacity/cap-tokens';
import { CoverageIndicator } from 'src/front-components/capacity/coverage-indicator';
import { ProjectPlanPanel } from 'src/front-components/capacity/project-plan-panel';
import { allocatedHours, planCoverage, type PreviewSource } from 'src/front-components/capacity/plan-preview';
import type { PlanSpread } from 'src/front-components/capacity/calc-load';
import type { CapProject, DeptRef, PlanSlot, ProjectPatch } from 'src/front-components/capacity/types';

// Редактируемая строка проекта (режим планирования): руководитель задаёт плановые
// часы и срок прямо в строке (быстрый путь). Пустой план → видимый affordance
// «задать план». Сохранение по Enter/blur; пересчёт делает родитель через onSave.
// WI-11: кнопка «✎ План» открывает inline-поповер (способ + диапазон С/ПО + живое
// превью раскида) для нетривиального планирования — spread/dept для превью.

type Props = {
  project: CapProject;
  nameWidth: number;
  fieldsWidth: number;
  onSave: (id: string, patch: ProjectPatch) => Promise<boolean>;
  spread?: PlanSpread; // WI-11: рабочие дни для превью раскида
  dept?: DeptRef; // WI-11: ёмкость отдела для овербукинга в превью (fallback)
  previewSource?: PreviewSource; // WI-48: свободная ёмкость + мульти-отдел в превью
  // Слоты проекта (уже загружены доской) — для индикатора «распланировано X / Y».
  // X = Σ dept-слотов (allocatedHours), Y = plannedEffort (бюджет). Опционально:
  // нет слотов → индикатор не рисуется (или X=0 при заданном бюджете).
  slots?: PlanSlot[];
};

const isoToDate = (iso: string | null): string => (iso ? String(iso).slice(0, 10) : '');

// DD.MM из ISO — короткая подпись даты начала (интервал распределения плана).
const shortDate = (iso: string | null): string => {
  if (!iso) return '';
  const s = String(iso).slice(0, 10);
  return `${s.slice(8, 10)}.${s.slice(5, 7)}`;
};

// Число часов: запятая→точка, отрицательные/нечисло отбрасываем (null = очистить).
export const parseEffort = (raw: string): number | null | undefined => {
  const s = raw.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined; // невалидно — не сохраняем
  return Math.round(n * 100) / 100;
};

// Решение строки по сырому вводу: что сохранять в plannedEffort.
//  undefined → ввод невалиден, ничего не сохраняем (revert).
//  null      → очистить план (пустой ввод ИЛИ 0 — «снять план», нет часов).
//  number>0  → объём плана.
// Семантика 0 = очистка: 0-часовой план бессмыслен (раскид по дням = 0) и раньше
// порождал лишний авто-startDate + REST-патч на каждый «0» (источник ошибки у
// заказчика). Возвращаем sentinel-объект, чтобы отличить «не сохранять» (skip)
// от «сохранить null».
export const planEffortFromInput = (
  raw: string,
): { skip: true } | { skip: false; effort: number | null } => {
  const parsed = parseEffort(raw);
  if (parsed === undefined) return { skip: true };
  return { skip: false, effort: parsed === 0 ? null : parsed };
};

const inputStyle = {
  height: 24,
  fontSize: 12,
  fontFamily: 'inherit',
  color: T.text,
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  padding: '0 6px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const ProjectPlanRow = ({ project, nameWidth, fieldsWidth, onSave, spread, dept, previewSource, slots }: Props) => {
  const [hours, setHours] = useState(project.plannedEffort != null ? String(project.plannedEffort) : '');
  const [end, setEnd] = useState(isoToDate(project.endDate));

  // Индикатор «распланировано X / Y»: Y = бюджет (plannedEffort). X зависит от
  // способа раскида:
  //  MANUAL → X = Σ dept-слотов (реальное помесячное распределение, из данных доски);
  //  EVEN   → X = Y (бюджет раскидывается равномерно на лету, без слотов — по
  //           определению распланирован полностью; иначе показывал бы ложное «0/N»).
  // Слоты приходят из доски (ноль доп.запросов). Бюджет НЕ перезаписывается.
  const isManual = project.planMethod === 'MANUAL';
  const coverage = useMemo(
    () =>
      planCoverage(
        project.plannedEffort,
        isManual ? allocatedHours(slots ?? []) : project.plannedEffort,
      ),
    [project.plannedEffort, isManual, slots],
  );

  // Синхронизация после рефетча (внешнее значение могло измениться).
  useEffect(() => {
    setHours(project.plannedEffort != null ? String(project.plannedEffort) : '');
  }, [project.plannedEffort]);
  useEffect(() => setEnd(isoToDate(project.endDate)), [project.endDate]);

  const empty = project.plannedEffort == null && !project.endDate;

  const commitHours = () => {
    const decision = planEffortFromInput(hours);
    if (decision.skip) {
      setHours(project.plannedEffort != null ? String(project.plannedEffort) : '');
      return;
    }
    const { effort } = decision; // 0 → null (снять план), см. planEffortFromInput
    if (effort === project.plannedEffort) return;
    // Без даты начала план не попадёт в горизонт — проставляем сегодня (UTC).
    // Только для реального плана (>0); при очистке (null) дату не трогаем.
    const patch: ProjectPatch = { plannedEffort: effort };
    if (effort != null && !project.startDate) patch.startDate = new Date().toISOString().slice(0, 10);
    void onSave(project.id, patch);
  };

  const commitEnd = () => {
    const next = end || null;
    if (next === isoToDate(project.endDate)) return;
    const patch: ProjectPatch = { endDate: next };
    if (next && !project.startDate) patch.startDate = new Date().toISOString().slice(0, 10);
    void onSave(project.id, patch);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (e.key === 'Enter') e.currentTarget.blur(); // target.blur() недоступен в Remote DOM
    if (e.key === 'Escape') {
      commit === commitHours
        ? setHours(project.plannedEffort != null ? String(project.plannedEffort) : '')
        : setEnd(isoToDate(project.endDate));
      e.currentTarget.blur();
    }
  };

  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.rowAlt }}>
      <div
        style={{
          width: nameWidth,
          minWidth: nameWidth,
          padding: '0 12px 0 28px',
          height: 36,
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
        title={project.name}
      >
        {project.name}
      </div>

      <div
        style={{
          width: fieldsWidth,
          minWidth: fieldsWidth,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
        }}
      >
        {empty && (
          <span style={{ fontSize: 11, color: T.accent, whiteSpace: 'nowrap' }}>
            ✎ задать план:
          </span>
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: T.textFaint }}>часы</span>
          <input
            value={hours}
            inputMode="decimal"
            placeholder="—"
            aria-label={`Плановые часы: ${project.name}`}
            onChange={(e) => setHours(e.target.value)}
            onBlur={commitHours}
            onKeyDown={(e) => onKey(e, commitHours)}
            style={{ ...inputStyle, width: 64, textAlign: 'right' }}
          />
        </label>
        <label
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          title="Плановые часы распределяются равномерно от даты начала проекта до этой даты завершения"
        >
          {project.startDate && (
            <span style={{ fontSize: 11, color: T.textFaint, whiteSpace: 'nowrap' }}>
              с {shortDate(project.startDate)} ·
            </span>
          )}
          <span style={{ fontSize: 11, color: T.textFaint, whiteSpace: 'nowrap' }}>завершить к</span>
          <input
            type="date"
            value={end}
            aria-label={`Дата завершения проекта: ${project.name}`}
            onChange={(e) => setEnd(e.target.value)}
            onBlur={commitEnd}
            onKeyDown={(e) => onKey(e, commitEnd)}
            style={{ ...inputStyle, width: 130 }}
          />
        </label>
        {/* Индикатор «распланировано X / Y» — стыковка распределения с бюджетом.
            Терракот-warning при переаллокации, ✓ при полном покрытии. Скрыт, если
            бюджет не задан (нечего сверять). marginLeft:auto толкает к панели. */}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {coverage.hasBudget && <CoverageIndicator coverage={coverage} variant="compact" />}
          <ProjectPlanPanel project={project} spread={spread} dept={dept} previewSource={previewSource} onSave={onSave} />
        </span>
      </div>
    </div>
  );
};
