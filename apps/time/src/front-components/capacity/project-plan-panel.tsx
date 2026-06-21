import { useMemo, useState } from 'react';

import { T } from 'src/front-components/capacity/cap-tokens';
import { computePreview, validateRange } from 'src/front-components/capacity/plan-preview';
import type { PlanSpread } from 'src/front-components/capacity/calc-load';
import type { CapProject, DeptRef, ProjectPatch } from 'src/front-components/capacity/types';

// WI-11 Фаза-1: inline-поповер «Планировать» на строке проекта (useState, паттерн
// row-menu/cell-comment — host-DOM/модалок нет в Remote DOM). Один экран:
// способ (Равномерно дефолт; Вручную — заглушка фаза-2) → диапазон С/ПО →
// объём в часах → ЖИВОЕ превью раскида по рабочим дням (двойник доски через
// plannedHoursInPeriod) + строка Σ-сверки + мягкая подсветка овербукинга.
// Сохранение через usePlanEdit.save (plannedEffort+startDate+endDate). Esc/Отмена
// без confirm. Сверка: Timetta resource-plan (диапазон + превью + Σ).

type Props = {
  project: CapProject;
  spread?: PlanSpread; // WI-05: рабочие дни для раскида превью (без него — пусто)
  dept?: DeptRef; // для овербукинга в превью (план периода > ёмкости отдела)
  onSave: (id: string, patch: ProjectPatch) => Promise<boolean>;
};

const isoToDate = (iso: string | null): string => (iso ? String(iso).slice(0, 10) : '');
const todayKey = (): string => new Date().toISOString().slice(0, 10);

// Число часов: запятая→точка, отрицательные/нечисло → null (план не задан).
const parseEffort = (raw: string): number | null => {
  const s = raw.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

const round = (n: number): number => Math.round(n);

const fieldStyle = {
  height: 26,
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

const tnum = { fontVariantNumeric: 'tabular-nums' as const };

export const ProjectPlanPanel = ({ project, spread, dept, onSave }: Props) => {
  const [open, setOpen] = useState(false);
  // Черновик независим от строки: Отмена/Esc отбрасывает без записи.
  const [method, setMethod] = useState<'EVEN' | 'MANUAL'>('EVEN');
  const [start, setStart] = useState(isoToDate(project.startDate) || todayKey());
  const [end, setEnd] = useState(isoToDate(project.endDate));
  const [hours, setHours] = useState(
    project.plannedEffort != null ? String(project.plannedEffort) : '',
  );
  const [saving, setSaving] = useState(false);

  const effort = parseEffort(hours);
  const rangeError = validateRange(start, end);

  const preview = useMemo(
    () =>
      spread?.hoursByDay && !rangeError && effort
        ? computePreview(effort, start, end, spread.hoursByDay, dept)
        : null,
    [spread, rangeError, effort, start, end, dept],
  );

  const close = () => setOpen(false);

  // Открытие — синхронизируем черновик с актуальным состоянием строки.
  const openPanel = () => {
    setMethod('EVEN');
    setStart(isoToDate(project.startDate) || todayKey());
    setEnd(isoToDate(project.endDate));
    setHours(project.plannedEffort != null ? String(project.plannedEffort) : '');
    setOpen(true);
  };

  const canSave = !rangeError && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(project.id, {
      plannedEffort: effort,
      startDate: start || null,
      endDate: end || null,
    });
    setSaving(false);
    if (ok) close();
  };

  const total = preview ? round(preview.total) : 0;
  const planTarget = effort != null ? round(effort) : 0;
  const sigmaOk = preview != null && Math.abs(total - planTarget) <= 1;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open ? close() : openPanel();
        }}
        title="Планировать: способ, период, превью раскида"
        aria-label={`Планировать проект: ${project.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          height: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
          border: `1px solid ${open ? T.accent : T.border}`,
          borderRadius: 6,
          background: open ? T.accentSoft : T.surface,
          color: T.accent,
          cursor: 'pointer',
          fontSize: 11.5,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        ✎ План
      </button>

      {open && (
        <>
          {/* Слой-перехватчик для закрытия кликом вне (Remote DOM: без портала). */}
          <div
            onClick={close}
            onKeyDown={(e) => e.key === 'Escape' && close()}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            role="dialog"
            aria-label={`План проекта: ${project.name}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                close();
              }
            }}
            style={{
              position: 'absolute',
              top: 28,
              left: 0,
              zIndex: 21,
              width: 360,
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 10 }}>
              План проекта
            </div>

            {/* Способ */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 10 }} role="radiogroup" aria-label="Способ распределения">
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.text, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`plan-method-${project.id}`}
                  checked={method === 'EVEN'}
                  onChange={() => setMethod('EVEN')}
                />
                Равномерно
              </label>
              <label
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textFaint, cursor: 'not-allowed' }}
                title="Ручной раскид по месяцам — фаза 2 (нужно бэк-поле planMethod)"
              >
                <input type="radio" name={`plan-method-${project.id}`} disabled checked={method === 'MANUAL'} onChange={() => {}} />
                Вручную по месяцам
                <span style={{ fontSize: 10, color: T.textFaint }}>скоро</span>
              </label>
            </div>

            {/* Период */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>С</span>
                <input
                  type="date"
                  value={start}
                  aria-label="Дата начала плана"
                  onChange={(e) => setStart(e.target.value)}
                  style={{ ...fieldStyle, width: 130 }}
                />
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>ПО</span>
                <input
                  type="date"
                  value={end}
                  aria-label="Дата завершения плана"
                  onChange={(e) => setEnd(e.target.value)}
                  style={{ ...fieldStyle, width: 130, borderColor: rangeError ? T.over : T.border }}
                />
              </label>
            </div>

            {/* Объём */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.textMuted, width: 48 }}>Объём</span>
              <input
                value={hours}
                inputMode="decimal"
                placeholder="—"
                aria-label="Плановый объём в часах"
                onChange={(e) => setHours(e.target.value)}
                style={{ ...fieldStyle, width: 80, textAlign: 'right', ...tnum }}
              />
              <span style={{ fontSize: 11, color: T.textFaint }}>часов</span>
            </div>

            {rangeError && (
              <div style={{ fontSize: 11, color: T.over, marginBottom: 10 }}>⚠ {rangeError}</div>
            )}

            {/* Живое превью */}
            {preview && preview.rows.length > 0 && (
              <div
                style={{
                  borderTop: `1px solid ${T.border}`,
                  paddingTop: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
                  Раскид по рабочим дням{dept && dept.headcount > 0 ? ` (ёмкость отдела ${dept.name})` : ''}:
                </div>
                <div style={{ maxHeight: 168, overflowY: 'auto' }}>
                  {preview.rows.map((r) => {
                    const w = preview.maxHours > 0 ? Math.round((r.hours / preview.maxHours) * 100) : 0;
                    return (
                      <div
                        key={r.key}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 11 }}
                      >
                        <span style={{ width: 56, color: T.textMuted }}>{r.label}</span>
                        <span style={{ flex: 1, height: 8, background: T.headerBg, borderRadius: 3, overflow: 'hidden' }}>
                          <span
                            style={{
                              display: 'block',
                              width: `${w}%`,
                              height: '100%',
                              background: r.over ? T.warnSolid : T.accent,
                              borderRadius: 3,
                            }}
                          />
                        </span>
                        <span style={{ width: 44, textAlign: 'right', color: T.text, ...tnum }}>
                          {round(r.hours)} ч
                        </span>
                        {r.over && (
                          <span
                            style={{
                              fontSize: 10,
                              color: T.warnSolid,
                              background: T.warnTint,
                              borderRadius: 3,
                              padding: '0 4px',
                              whiteSpace: 'nowrap',
                              ...tnum,
                            }}
                            title={`План ${round(r.hours)} ч > ёмкости ${round(r.capacity ?? 0)} ч`}
                          >
                            ⚠ +{round(r.hours - (r.capacity ?? 0))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Σ-сверка */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: T.textMuted,
                    borderTop: `1px solid ${T.border}`,
                    marginTop: 6,
                    paddingTop: 6,
                    ...tnum,
                  }}
                >
                  <span>Σ раскид = {total} ч · план {planTarget} ч</span>
                  <span style={{ color: sigmaOk ? T.text : T.over }}>{sigmaOk ? '✓' : '≠'}</span>
                </div>
              </div>
            )}

            {/* Действия */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={close}
                style={{
                  height: 28,
                  padding: '0 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  background: T.surface,
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'inherit',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!canSave}
                style={{
                  height: 28,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 6,
                  background: canSave ? T.accent : T.border,
                  color: canSave ? T.onAccent : T.textFaint,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                }}
              >
                {saving ? 'Сохранение…' : 'Сохранить план'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
