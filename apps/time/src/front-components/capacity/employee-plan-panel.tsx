import { useEffect, useMemo, useState } from 'react';

import { T } from 'src/front-components/capacity/cap-tokens';
import {
  monthsInRange,
  reconcileSlots,
  validateRange,
} from 'src/front-components/capacity/plan-preview';
import {
  fetchPlanSlots,
  savePlanSlots,
  type PlanSlotInput,
} from 'src/front-components/capacity/plan-slots-rest';
import type { CapProject, EmployeeRef } from 'src/front-components/capacity/types';

// Планирование ДО СОТРУДНИКА (PLANNING_EMPLOYEE_LEVEL §3.1/§5-шаг3, MVP).
// Инлайн-поповер «✎ План» на строке сотрудника в срезе «Люди». Персональный слот
// = (project × employee × month) → плановые часы. Тот же MANUAL-механизм, что у
// project-plan-panel (monthsInRange + помесячный ввод + Σ-сверка reconcileSlots),
// но слоты несут employeeId (контракт Dev2 /s/plan-slots, дедуп month|dept|emp →
// персональный слот ≠ отдельский, не схлопывается). departmentId слота = отдел
// сотрудника (rollup отдела вычитает персональные из остатка — анти-двойной-счёт).
//
// Раньше в режиме «Люди» планирование было НЕДОСТУПНО (тумблер «Планировать»
// перекидывал на «Отделы»). Теперь — персональный план прямо на строке человека.
// Remote DOM: useState + токены, без host-DOM/портала (паттерн project-plan-panel).

type Props = {
  employee: EmployeeRef;
  // Проекты, на которые можно расписать персональный план. Персональный слот
  // требует проект (slot = project×emp×month). Выбор проекта — в панели.
  projects: CapProject[];
  onSaved?: () => void; // перезагрузить доску после сохранения (опц.)
};

const todayKey = (): string => new Date().toISOString().slice(0, 10);
const isoToDate = (iso: string | null): string => (iso ? String(iso).slice(0, 10) : '');

// Число часов: запятая→точка, отрицательные/нечисло → null (часы не заданы).
export const parsePlanHours = (raw: string): number | null => {
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

export const EmployeePlanPanel = ({ employee, projects, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '');
  const [start, setStart] = useState(todayKey());
  const [end, setEnd] = useState('');
  // Сырые строки инпутов по месяцу (periodMonth → текст), парсятся parsePlanHours.
  const [slotHours, setSlotHours] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  const rangeError = validateRange(start, end);
  const needsEnd = !end; // помесячный раскид требует конечный диапазон
  const months = useMemo(
    () => (needsEnd ? [] : monthsInRange(start, end)),
    [needsEnd, start, end],
  );

  // Живая Σ персонального раскида (без жёсткой цели — план человека самостоятелен).
  const sum = useMemo(
    () => reconcileSlots(months.map((m) => ({ plannedHours: parsePlanHours(slotHours[m.periodMonth] ?? '') })), null).sum,
    [months, slotHours],
  );

  // Префилл: слоты проекта из бэка, отфильтрованные на ЭТОГО сотрудника. При смене
  // проекта/открытии перетягиваем. Диапазон подстраиваем под даты проекта.
  useEffect(() => {
    if (!open || !projectId) return;
    let alive = true;
    setError(null);
    setLoading(true);
    if (project) {
      setStart(isoToDate(project.startDate) || todayKey());
      setEnd(isoToDate(project.endDate));
    }
    fetchPlanSlots(projectId)
      .then((slots) => {
        if (!alive) return;
        const mine = slots.filter((s) => s.employeeId === employee.id);
        const hoursMap: Record<string, string> = {};
        for (const s of mine) hoursMap[s.periodMonth] = String(s.plannedHours);
        setSlotHours(hoursMap);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки слотов');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, employee.id]);

  const close = () => setOpen(false);
  const openPanel = () => {
    setProjectId((prev) => prev || projects[0]?.id || '');
    setSlotHours({});
    setError(null);
    setOpen(true);
  };

  const canSave = !!projectId && !rangeError && !needsEnd && !saving && !loading;

  const save = async () => {
    if (!canSave || !projectId) return;
    setSaving(true);
    try {
      // Персональные слоты этого сотрудника по проекту. departmentId = отдел
      // сотрудника (rollup отдела вычитает персональные из остатка). 0 → удаление
      // слота на бэке (явный «нет часов» в месяце).
      const slots: PlanSlotInput[] = months.map((m) => ({
        periodMonth: m.periodMonth,
        plannedHours: parsePlanHours(slotHours[m.periodMonth] ?? '') ?? 0,
        departmentId: employee.departmentId ?? null,
        employeeId: employee.id,
      }));
      const ok = await savePlanSlots(projectId, slots);
      setSaving(false);
      if (ok) {
        onSaved?.();
        close();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения слотов');
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open ? close() : openPanel();
        }}
        title={`Планировать часы сотруднику ${employee.name} по месяцам`}
        aria-label={`Планировать сотрудника: ${employee.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          height: 22,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 7px',
          border: `1px solid ${open ? T.accent : T.border}`,
          borderRadius: 6,
          background: open ? T.accentSoft : T.surface,
          color: T.accent,
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        ✎ План
      </button>

      {open && (
        <>
          <div
            onClick={close}
            onKeyDown={(e) => e.key === 'Escape' && close()}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            role="dialog"
            aria-label={`Персональный план: ${employee.name}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                close();
              }
            }}
            style={{
              position: 'absolute',
              top: 26,
              left: 0,
              zIndex: 21,
              width: 'min(340px, calc(100vw - 32px))',
              maxHeight: 'min(540px, calc(100vh - 96px))',
              display: 'flex',
              flexDirection: 'column',
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
            }}
          >
            <div style={{ overflowY: 'auto', padding: '12px 12px 4px' }}>
              {/* Кто планируется — имя сотрудника в заголовке (impeccable: ясность). */}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                План сотрудника
              </div>
              <div
                style={{ fontSize: 11.5, color: T.accent, marginBottom: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={employee.name}
              >
                {employee.name}
              </div>

              {projects.length === 0 ? (
                <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
                  Нет проектов для планирования. Персональный план привязывается к проекту.
                </div>
              ) : (
                <>
                  {/* Проект */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: T.textMuted, width: 48, flexShrink: 0 }}>Проект</span>
                    <select
                      value={projectId}
                      aria-label="Проект персонального плана"
                      onChange={(e) => setProjectId(e.target.value)}
                      style={{ ...fieldStyle, flex: 1, minWidth: 0 }}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `${p.code} · ${p.name}` : p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Период */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flex: '1 1 130px', minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>С</span>
                      <input
                        type="date"
                        value={start}
                        aria-label="Дата начала плана"
                        onChange={(e) => setStart(e.target.value)}
                        style={{ ...fieldStyle, flex: 1, minWidth: 0 }}
                      />
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flex: '1 1 130px', minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>ПО</span>
                      <input
                        type="date"
                        value={end}
                        aria-label="Дата завершения плана"
                        onChange={(e) => setEnd(e.target.value)}
                        style={{ ...fieldStyle, flex: 1, minWidth: 0, borderColor: rangeError ? T.over : T.border }}
                      />
                    </label>
                  </div>

                  {rangeError && (
                    <div style={{ fontSize: 11, color: T.over, marginBottom: 12 }}>⚠ {rangeError}</div>
                  )}
                  {needsEnd && !rangeError && (
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
                      Укажите дату «ПО» — помесячный план строится по конечному диапазону.
                    </div>
                  )}
                  {loading && (
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Загрузка слотов…</div>
                  )}
                  {error && (
                    <div style={{ fontSize: 11, color: T.over, marginBottom: 8 }}>⚠ {error}</div>
                  )}

                  {/* Помесячный ввод */}
                  {!needsEnd && months.length > 0 && (
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Часы по месяцам:</div>
                      {months.map((m) => (
                        <div
                          key={m.periodMonth}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11, minWidth: 0 }}
                        >
                          <span style={{ flex: 1, minWidth: 0, color: T.textMuted }}>{m.label}</span>
                          <input
                            value={slotHours[m.periodMonth] ?? ''}
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={`Плановые часы за ${m.label}`}
                            onChange={(e) =>
                              setSlotHours((prev) => ({ ...prev, [m.periodMonth]: e.target.value }))
                            }
                            style={{ ...fieldStyle, width: 72, textAlign: 'right', ...tnum }}
                          />
                          <span style={{ width: 16, flexShrink: 0, fontSize: 10, color: T.textFaint }}>ч</span>
                        </div>
                      ))}

                      {/* Σ персонального плана */}
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
                        <span>Σ персональный план = {round(sum)} ч</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                flexShrink: 0,
                padding: '10px 12px 12px',
                borderTop: `1px solid ${T.border}`,
              }}
            >
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
