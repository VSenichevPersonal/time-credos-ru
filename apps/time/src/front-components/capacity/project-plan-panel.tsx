import { useEffect, useMemo, useState } from 'react';

import { T, loadTone, formatPct } from 'src/front-components/capacity/cap-tokens';
import {
  computePreview,
  deptInputSlots,
  monthsInRange,
  openEndedHint,
  personalSlotsByMonth,
  previewLoadCtxFor,
  reconcileSlots,
  utilPct,
  validateRange,
  type PreviewSource,
} from 'src/front-components/capacity/plan-preview';
import {
  fetchPlanSlots,
  savePlanSlots,
  type PlanSlotInput,
} from 'src/front-components/capacity/plan-slots-rest';
import type { PlanSpread } from 'src/front-components/capacity/calc-load';
import type { CapProject, DeptRef, ProjectPatch } from 'src/front-components/capacity/types';

// WI-11 Фаза-1: inline-поповер «Планировать» на строке проекта (useState, паттерн
// row-menu/cell-comment — host-DOM/модалок нет в Remote DOM). Один экран:
// способ (Равномерно дефолт; Вручную по месяцам — WI-47) → диапазон С/ПО →
// объём в часах → ЖИВОЕ превью раскида по рабочим дням (двойник доски через
// plannedHoursInPeriod) + строка Σ-сверки + мягкая подсветка овербукинга.
// Сохранение через usePlanEdit.save (plannedEffort+startDate+endDate). Esc/Отмена
// без confirm. Сверка: Timetta resource-plan (диапазон + превью + Σ).
//
// WI-47 «Вручную по месяцам» (приоритет заказчика): радио MANUAL включает
// редактируемые помесячные строки (месяцы из диапазона С..ПО, monthsInRange),
// input plannedHours на месяц, живая Σ-сверка (reconcileSlots) вместо EVEN-превью.
// Префилл из GET /s/plan-slots при открытии, сохранение upsert каждого месяца
// (savePlanSlots). EVEN-режим — дефолт, не тронут. Контракт Dev2: plan-slots-rest.

type Props = {
  project: CapProject;
  spread?: PlanSpread; // WI-05: рабочие дни для раскида превью (без него — пусто)
  dept?: DeptRef; // back-compat: овербукинг vs ПОЛНОЙ ёмкости одного отдела
  // WI-48 W3B.18/22: данные доски для овербукинга vs СВОБОДНОЙ ёмкости отдела(ов).
  // Приоритетнее dept: даёт занятость др. проектами/планами/бронями + доли отделов.
  previewSource?: PreviewSource;
  onSave: (id: string, patch: ProjectPatch) => Promise<boolean>;
};

const isoToDate = (iso: string | null): string => (iso ? String(iso).slice(0, 10) : '');
const todayKey = (): string => new Date().toISOString().slice(0, 10);

// SSOT: способ раскида читается из сохранённого project.planMethod (round-trip).
// MANUAL → панель открывается в ручном режиме с префиллом слотов; иначе EVEN.
// Экспорт для unit-теста init/reset (env=node, без mount панели).
export const methodOf = (project: CapProject): 'EVEN' | 'MANUAL' =>
  project.planMethod === 'MANUAL' ? 'MANUAL' : 'EVEN';

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

export const ProjectPlanPanel = ({ project, spread, dept, previewSource, onSave }: Props) => {
  const [open, setOpen] = useState(false);
  // Черновик независим от строки: Отмена/Esc отбрасывает без записи.
  const [method, setMethod] = useState<'EVEN' | 'MANUAL'>(methodOf(project));
  const [start, setStart] = useState(isoToDate(project.startDate) || todayKey());
  const [end, setEnd] = useState(isoToDate(project.endDate));
  const [hours, setHours] = useState(
    project.plannedEffort != null ? String(project.plannedEffort) : '',
  );
  const [saving, setSaving] = useState(false);
  // WI-47: ручной раскид. Сырые строки инпутов по месяцу (periodMonth → текст),
  // парсятся parseEffort как объём. departmentId слота помним отдельно (префилл).
  const [slotHours, setSlotHours] = useState<Record<string, string>>({});
  const [slotDept, setSlotDept] = useState<Record<string, string | null>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  // P1: Σ персональных слотов проекта (роздано людям). Read-only — для чипа,
  // в поля dept-панели не попадает (employee-plan-panel редактирует это).
  const [personalHours, setPersonalHours] = useState(0);

  const effort = parseEffort(hours);
  const rangeError = validateRange(start, end);
  // W3B.23: пустой ПО — не ошибка, а «открытый план» (тянем до горизонта). Подсказка.
  const endHint = openEndedHint(end);

  // WI-48 W3B.18/22: контекст свободной ёмлости отдела(ов) под этот проект
  // (резолвит долевые отделы, исключает сам проект из «занятого»). Fallback на dept.
  const loadCtx = useMemo(
    () => previewLoadCtxFor(project, previewSource),
    [project, previewSource],
  );

  const preview = useMemo(
    () =>
      spread?.hoursByDay && !rangeError && effort
        ? computePreview(effort, start, end, spread.hoursByDay, loadCtx ?? dept)
        : null,
    [spread, rangeError, effort, start, end, loadCtx, dept],
  );

  // WI-48 W3B.21: число периодов с овербукингом (для инлайн-баннера; кнопка активна).
  const overCount = preview?.overCount ?? 0;

  // WI-47: месяцы ручного раскида из диапазона С..ПО (только когда ПО задан —
  // помесячный режим требует конечный диапазон; открытый план тут не применим).
  const months = useMemo(
    () => (method === 'MANUAL' ? monthsInRange(start, end) : []),
    [method, start, end],
  );

  // WI-47: живая Σ-сверка ручного раскида (Σ слотов vs объём проекта). Парсим
  // сырые инпуты текущих месяцев через parseEffort. target = объём (effort).
  const manualRecon = useMemo(() => {
    const slots = months.map((m) => ({ plannedHours: parseEffort(slotHours[m.periodMonth] ?? '') }));
    return reconcileSlots(slots, effort);
  }, [months, slotHours, effort]);

  // WI-47: префилл слотов проекта из бэка при первом переключении в MANUAL
  // (один раз на открытие — если уже грузили или есть значения, не перезатираем).
  useEffect(() => {
    if (!open || method !== 'MANUAL') return;
    let alive = true;
    setSlotsError(null);
    setSlotsLoading(true);
    fetchPlanSlots(project.id)
      .then((slots) => {
        if (!alive) return;
        // P1: поля ввода dept-панели префиллим ТОЛЬКО отдельскими слотами
        // (employeeId пуст) — персональные не протекают в чужие поля.
        const hoursMap: Record<string, string> = {};
        const deptMap: Record<string, string | null> = {};
        for (const s of deptInputSlots(slots)) {
          hoursMap[s.periodMonth] = String(s.plannedHours);
          deptMap[s.periodMonth] = s.departmentId ?? null;
        }
        setSlotHours((prev) => ({ ...hoursMap, ...prev }));
        setSlotDept((prev) => ({ ...deptMap, ...prev }));
        // P1: Σ персональных (роздано людям) — для read-only чипа.
        setPersonalHours(personalSlotsByMonth(slots).total);
        setSlotsLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setSlotsError(e instanceof Error ? e.message : 'Ошибка загрузки слотов');
        setSlotsLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, method, project.id]);

  const close = () => setOpen(false);

  // Открытие — синхронизируем черновик с актуальным состоянием строки.
  const openPanel = () => {
    setMethod(methodOf(project));
    setStart(isoToDate(project.startDate) || todayKey());
    setEnd(isoToDate(project.endDate));
    setHours(project.plannedEffort != null ? String(project.plannedEffort) : '');
    setSlotHours({});
    setSlotDept({});
    setSlotsError(null);
    setPersonalHours(0);
    setOpen(true);
  };

  // WI-47: в MANUAL нужен конечный диапазон (помесячные строки строятся из С..ПО).
  // Пустой ПО в ручном режиме блокирует сохранение (нечего раскидывать помесячно).
  const manualNeedsEnd = method === 'MANUAL' && !end;
  const canSave = !rangeError && !manualNeedsEnd && !saving && !slotsLoading;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (method === 'MANUAL') {
        // Upsert каждого месяца (включая 0 — явный «нет часов» в месяце). Объём
        // проекта/диапазон тоже сохраняем строкой, чтобы доска знала границы.
        // P1: dept-панель пишет ТОЛЬКО отдельские слоты (employeeId=null) — дедуп
        // upsert по project×dept|null×emp|null×month не трогает персональные слоты.
        const slots: PlanSlotInput[] = months.map((m) => ({
          periodMonth: m.periodMonth,
          plannedHours: parseEffort(slotHours[m.periodMonth] ?? '') ?? 0,
          departmentId: slotDept[m.periodMonth] ?? project.departmentId ?? null,
          employeeId: null,
        }));
        const slotsOk = await savePlanSlots(project.id, slots);
        const rowOk = await onSave(project.id, {
          plannedEffort: manualRecon.sum,
          startDate: start || null,
          endDate: end || null,
          planMethod: 'MANUAL',
        });
        setSaving(false);
        if (slotsOk && rowOk) close();
        return;
      }
      const ok = await onSave(project.id, {
        plannedEffort: effort,
        startDate: start || null,
        endDate: end || null,
        planMethod: 'EVEN',
      });
      setSaving(false);
      if (ok) close();
    } catch (e: unknown) {
      setSlotsError(e instanceof Error ? e.message : 'Ошибка сохранения слотов');
      setSaving(false);
    }
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
              // Защита от переполнения: кнопка «План» стоит у правого края строки,
              // поэтому якорим панель ВПРАВО (right:0 → раскрытие влево от кнопки) —
              // так она не уходит за правый край viewport. Ширина зажата по экрану
              // (clamp на 100vw), чтобы на узком экране не вылезла и за левый край.
              // Remote DOM: чистый CSS, без getBoundingClientRect.
              position: 'absolute',
              top: 28,
              right: 0,
              zIndex: 21,
              width: 'min(360px, calc(100vw - 32px))',
              maxHeight: 'min(560px, calc(100vh - 96px))',
              display: 'flex',
              flexDirection: 'column',
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
            }}
          >
            {/* Прокручиваемое тело: высокий контент (длинное превью) скроллится тут,
                футер с кнопками остаётся закреплён снизу и всегда виден. */}
            <div style={{ overflowY: 'auto', padding: '12px 12px 4px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 12 }}>
              План проекта
            </div>

            {/* P1: read-only чип «людям N ч» — Σ персональных слотов проекта (роздано
                сотрудникам). Здесь не редактируется (это делает панель сотрудника) —
                планировщик отдела видит занятый людьми объём. Только когда есть >0. */}
            {personalHours > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: T.text,
                  background: T.accentSoft,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: '3px 8px',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
                title="Сумма персональных планов сотрудников по этому проекту. Редактируется на строке сотрудника, не здесь."
              >
                <span style={{ color: T.textMuted }}>людям</span>
                <span style={{ fontWeight: 600, ...tnum }}>{round(personalHours)} ч</span>
              </div>
            )}

            {/* Способ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }} role="radiogroup" aria-label="Способ распределения">
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.text, cursor: 'pointer' }}
                title="Ручной раскид: объём по месяцам диапазона задаётся вручную"
              >
                <input
                  type="radio"
                  name={`plan-method-${project.id}`}
                  checked={method === 'MANUAL'}
                  onChange={() => setMethod('MANUAL')}
                />
                Вручную по месяцам
              </label>
            </div>

            {/* Период. Поля переносятся и сжимаются (flex + flexWrap), чтобы date-инпуты
                не обрезались на узкой панели и не вылезали за её правый край. */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flex: '1 1 140px', minWidth: 0 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>С</span>
                <input
                  type="date"
                  value={start}
                  aria-label="Дата начала плана"
                  onChange={(e) => setStart(e.target.value)}
                  style={{ ...fieldStyle, flex: 1, minWidth: 0 }}
                />
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flex: '1 1 140px', minWidth: 0 }}>
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

            {/* Объём */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
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
              <div style={{ fontSize: 11, color: T.over, marginBottom: 12 }}>⚠ {rangeError}</div>
            )}

            {/* W3B.23: пустой ПО — открытый план (не блок), мягкая подсказка. Только
                EVEN: ручной режим требует конечный диапазон (своя подсказка ниже). */}
            {method === 'EVEN' && !rangeError && endHint && (
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>↗ {endHint}</div>
            )}

            {/* WI-48 W3B.21: инлайн-баннер овербукинга. Кнопка остаётся активной —
                планирование с перегрузом не блокируется (как доска), только предупреждение. */}
            {method === 'EVEN' && overCount > 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.warnSolid,
                  background: T.warnTint,
                  border: `1px solid ${T.warnSolid}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  marginBottom: 12,
                  lineHeight: 1.4,
                }}
                role="status"
              >
                ⚠ Овербукинг в {overCount}{' '}
                {overCount === 1 ? 'периоде' : overCount < 5 ? 'периодах' : 'периодах'}: план превышает свободную ёмкость отдела. Можно сохранить — это предупреждение.
              </div>
            )}

            {/* WI-47: ручной помесячный раскид (MANUAL). Редактируемые строки —
                месяцы диапазона С..ПО, input plannedHours на месяц, живая Σ-сверка.
                Скролл-фолбэк (длинный диапазон) обеспечен внешним overflow-y тела. */}
            {method === 'MANUAL' && (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>
                  Объём по месяцам:
                </div>

                {slotsLoading && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Загрузка слотов…</div>
                )}
                {slotsError && (
                  <div style={{ fontSize: 11, color: T.over, marginBottom: 8 }}>⚠ {slotsError}</div>
                )}
                {manualNeedsEnd && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>
                    Укажите дату «ПО» — помесячный раскид строится по конечному диапазону.
                  </div>
                )}

                {!manualNeedsEnd && months.length > 0 && (
                  <div>
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

                    {/* Σ-сверка ручного раскида: Σ(слоты) vs объём проекта */}
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
                      <span>
                        Σ раскид = {round(manualRecon.sum)} ч
                        {effort != null ? ` · план ${round(effort)} ч` : ' · объём не задан'}
                      </span>
                      <span style={{ color: manualRecon.ok ? T.text : T.over }}>
                        {effort == null ? '·' : manualRecon.ok ? '✓' : '≠'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Живое превью (EVEN) */}
            {method === 'EVEN' && preview && preview.rows.length > 0 && (
              <div
                style={{
                  borderTop: `1px solid ${T.border}`,
                  paddingTop: 10,
                  marginBottom: 4,
                }}
              >
                {/* Описание переносится (white-space:normal), а не обрезается —
                    название отдела может быть длинным. */}
                <div
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    marginBottom: 8,
                    whiteSpace: 'normal',
                    lineHeight: 1.4,
                  }}
                >
                  Раскид по рабочим дням{
                    loadCtx
                      ? ` (свободная ёмкость ${loadCtx.depts.map((d) => d.name).join(', ')})`
                      : dept && dept.headcount > 0
                        ? ` (ёмкость отдела ${dept.name})`
                        : ''
                  }:
                </div>
                {/* Без вложенного скролла: панель скроллится целиком, двойной скролл
                    (nested) — антипаттерн и прятал бы кнопки. */}
                <div>
                  {preview.rows.map((r) => {
                    const w = preview.maxHours > 0 ? Math.round((r.hours / preview.maxHours) * 100) : 0;
                    // W3B.16: утилизация периода = план / свободная ёмкость (доля
                    // съеденной ёмкости). null = нет ёмкости → util%-чип не рисуем.
                    const util = utilPct(r);
                    const tone = loadTone(util);
                    return (
                      <div
                        key={r.key}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, minWidth: 0 }}
                      >
                        <span style={{ width: 56, flexShrink: 0, color: T.textMuted }}>{r.label}</span>
                        <span style={{ flex: 1, minWidth: 0, height: 8, background: T.headerBg, borderRadius: 3, overflow: 'hidden' }}>
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
                        <span style={{ width: 44, flexShrink: 0, textAlign: 'right', color: T.text, ...tnum }}>
                          {round(r.hours)} ч
                        </span>
                        {/* W3B.16: util%-чип — план vs свободная ёмкость периода.
                            Цвет/насыщенность — loadTone (свободно→зелёный тише,
                            перегруз→терракот), как ячейки доски. null → плейсхолдер
                            «—», чтобы колонка не разъезжалась. */}
                        {util != null ? (
                          <span
                            style={{
                              width: 38,
                              flexShrink: 0,
                              textAlign: 'center',
                              fontSize: 10,
                              color: tone.fg,
                              background: tone.bg,
                              borderRadius: 3,
                              padding: '1px 0',
                              ...tnum,
                            }}
                            title={`Утилизация ${formatPct(util)}: план ${round(r.hours)} ч из ${round(r.capacity ?? 0)} ч свободной ёмкости${r.fullCapacity != null ? ` (полная ${round(r.fullCapacity)} ч)` : ''}`}
                          >
                            {formatPct(util)}
                          </span>
                        ) : (
                          <span style={{ width: 38, flexShrink: 0, textAlign: 'center', fontSize: 10, color: T.textFaint }}>
                            —
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
            </div>

            {/* Действия — закреплённый футер вне зоны скролла: кнопки всегда видны,
                даже когда превью длинное. Граница сверху отделяет от тела. */}
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
