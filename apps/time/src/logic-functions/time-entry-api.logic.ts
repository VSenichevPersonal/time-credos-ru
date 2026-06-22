import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { ENTRY_STATUS } from 'src/constants/approval';
import {
  VALIDATION_DEFAULTS,
  type ValidationThresholds,
  validateEntry,
  validatePositiveHours,
} from 'src/constants/validation';
import { isIsoDate, isUuid } from './params-validate';
// SSOT-пересчёт rollup-поля проекта (factHours/budgetRemaining). Один источник
// формулы и поведения — общий с database-event триггерами (project-fact-rollup.logic.ts).
import { recalcProjectFactHours } from './project-fact-rollup';
// CISO-005 server-truth актор (фундамент on-behalf/lockdown/аудита). Резолвится на
// входе; при trusted-акторе ВКЛЮЧАЕТСЯ on-behalf-gate (canWriteFor), иначе CRUD
// деградирует на resolveEmployeeId (текущее поведение, dev/legacy без identity).
import { type Actor, resolveActor } from './shared/resolve-actor';
// ON-BEHALF server-gate (MANAGER_ENTRY_ON_BEHALF §3.1.B): может ли trusted-actor
// писать ЗА сотрудника target (свой / руководитель отдела / PM проекта / админ).
import { canWriteFor } from './shared/can-write-for';
// AUDIT-LOG (MVP-гибрид): запись строки журнала изменений на каждой мутации.
// Побочная — НИКОГДА не роняет CRUD (writeEntryLog глотает ошибки внутри).
import { writeEntryLog } from './shared/write-entry-log';
// PERIOD-LOCKDOWN (CISO-011 SSOT, 2-е правило): закрытие прошлых периодов по дате.
// canMutateInPeriod — закрыта ли дата записи для актора (override = руководитель).
import { type LockdownConfig, canMutateInPeriod } from './shared/lockdown';

// /s/time-entry — CRUD трудозатрат для front-компонента (песочница без доступа к БД).
// Работает поверх Core REST воркспейса (TWENTY_API_URL + TWENTY_APP_ACCESS_TOKEN
// инжектятся платформой). Сотрудник определяется по workspaceMemberRef; если не
// сопоставлен — берём первого активного (не падаем).

type TimeEntry = {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  projectId: string | null;
  workTypeId: string | null;
  employeeId: string | null;
};

type RefItem = { id: string; name: string; code?: string };

// Тонкий REST-клиент к Core API воркспейса (на нативном fetch серверного рантайма).
const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

const restGet = async <T>(path: string, query: Record<string, string>): Promise<T> => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${apiBase()}${path}?${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

const restSend = async <T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json().catch(() => ({}))) as T;
};

const api = {
  get: restGet,
  post: <T>(p: string, b: unknown) => restSend<T>('POST', p, b),
  patch: <T>(p: string, b: unknown) => restSend<T>('PATCH', p, b),
  delete: (p: string) => restSend('DELETE', p),
};

// gap-аудит v3 #4: пороги валидации — ДАННЫЕ из singleton credosTimeSettings,
// не хардкод. Лимит часов/день (maxHoursPerDay) → ERROR; порог переработки
// (overtimeWarnHours) → WARNING. warnOnScheduleDeviation=false выключает
// предупреждения о переработке (лимит-ERROR остаётся всегда). Любая ошибка
// чтения настроек → безопасные дефолты (VALIDATION_DEFAULTS, лимит 24).
type RawSettingsValidation = {
  maxHoursPerDay?: number | null;
  overtimeWarnHours?: number | null;
  warnOnScheduleDeviation?: boolean | null;
  // PERIOD-LOCKDOWN: lockdown читается ТЕМ ЖЕ singleton-GET (без лишнего запроса).
  lockdownDate?: string | null;
  lockdownGraceDays?: number | null;
};
const LOCKDOWN_OFF: LockdownConfig = { lockdownDate: null, graceDays: 0 };
// Один GET singleton-настроек → пороги валидации + lockdown-конфиг (SSOT-чтение,
// не плодим запросы). Любая ошибка чтения → безопасные дефолты (лимит 24,
// lockdown выкл). lockdown в том же ответе → upsert НЕ добавляет лишний fetch.
const readSettings = async (): Promise<{
  thresholds: ValidationThresholds;
  lockdown: LockdownConfig;
}> => {
  try {
    const res = await api.get<{
      data: { credosTimeSettings: RawSettingsValidation[] };
    }>('/rest/credosTimeSettings', { limit: '1' });
    const s = res.data?.credosTimeSettings?.[0];
    const maxHoursPerDay =
      typeof s?.maxHoursPerDay === 'number' && s.maxHoursPerDay > 0
        ? s.maxHoursPerDay
        : VALIDATION_DEFAULTS.maxHoursPerDay;
    // warnOnScheduleDeviation=false → выключаем WARNING переработки (порог 0).
    const warnEnabled = s?.warnOnScheduleDeviation !== false;
    const overtimeWarnHours = !warnEnabled
      ? 0
      : typeof s?.overtimeWarnHours === 'number' && s.overtimeWarnHours > 0
        ? s.overtimeWarnHours
        : VALIDATION_DEFAULTS.overtimeWarnHours;
    const lockdownDate =
      typeof s?.lockdownDate === 'string' && s.lockdownDate ? s.lockdownDate : null;
    const graceDays =
      typeof s?.lockdownGraceDays === 'number' && s.lockdownGraceDays > 0
        ? Math.floor(s.lockdownGraceDays)
        : 0;
    return {
      thresholds: {
        maxHoursPerDay,
        overtimeWarnHours,
        minHoursPerWeek: VALIDATION_DEFAULTS.minHoursPerWeek,
      },
      lockdown: { lockdownDate, graceDays },
    };
  } catch {
    return { thresholds: { ...VALIDATION_DEFAULTS }, lockdown: { ...LOCKDOWN_OFF } };
  }
};

// Чтение query/body независимо от метода (RoutePayload AWS-формат).
const readParams = (event: RoutePayload): Record<string, string> => {
  const q = (event.queryStringParameters ?? {}) as Record<string, string>;
  const b = (event.body ?? {}) as Record<string, unknown>;
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) merged[k] = v;
  for (const [k, v] of Object.entries(b))
    if (v !== null && v !== undefined) merged[k] = String(v);
  return merged;
};

// Резолв сотрудника по workspaceMemberRef.
// ВАЖНО: RoutePayload отдаёт только event.userWorkspaceId (userWorkspace ID,
// НЕ workspaceMember ID) и не содержит email — серверного маппинга
// userWorkspace -> workspaceMember через REST нет. Поэтому клиент обязан
// передавать workspaceMemberRef явно в params. Сопоставление идёт по
// credosTimeEmployee.workspaceMemberRef == переданный ref.
const resolveEmployeeId = async (
  workspaceMemberRef: string | undefined,
): Promise<string | null> => {
  // CISO-006: workspaceMemberRef идёт в filter — запрашиваем только если это UUID
  // (невалидный/инъекция → как несопоставленный, уходит в DEV-fallback ниже).
  if (workspaceMemberRef && isUuid(workspaceMemberRef)) {
    const byRef = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
      '/rest/credosTimeEmployees',
      { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
    );
    const found = byRef.data?.credosTimeEmployees?.[0];
    if (found) return found.id;
  }
  // Fallback (DEV-ONLY): ref не передан или не сопоставлен. Возвращаем первого
  // активного, чтобы dev-сетка не падала. В проде это маскирует
  // несопоставленного пользователя — заполни workspaceMemberRef у сотрудников.
  // TODO(prod): убрать fallback, отдавать null + ошибку «сотрудник не сопоставлен».
  // eslint-disable-next-line no-console
  console.warn(
    '[time-entry-api] workspaceMemberRef не сопоставлен (ref=%s) — DEV fallback на первого активного',
    workspaceMemberRef ?? '(пусто)',
  );
  const fallback = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
    '/rest/credosTimeEmployees',
    { filter: 'active[eq]:true', limit: '1' },
  );
  return fallback.data?.credosTimeEmployees?.[0]?.id ?? null;
};

// recalcProjectFactHours вынесен в ./project-fact-rollup (SSOT) и переиспользуется
// database-event триггерами — единая формула и единый сбор записей по курсору.

// SCOUT-B: ключ уникальности записи трудозатрат — (employeeId, projectId,
// workTypeId, date-день). Зеркалит уникальный индекс credos-time-entry-unique.
// БД-индекс ловит дубли на всех путях, но: (1) NULL != NULL → строки с NULL в
// projectId/workTypeId индексом не ловятся; (2) приложенческая upsert-семантика
// (тот же ключ → update, а не 500 от констрейнта). Этот гард закрывает оба.
// date нормализуем по календарному дню (диапазон [день 00:00, день 23:59:59]).
const dayBounds = (iso: string): { from: string; to: string } => {
  const day = iso.slice(0, 10);
  return { from: `${day}T00:00:00.000Z`, to: `${day}T23:59:59.999Z` };
};

// WI-51 / W5C.2: уникальный БД-индекс по DATE_TIME (полное значение) vs гард по
// диапазону ДНЯ. Если записи в один день имеют РАЗНОЕ время — индекс их различит
// и пропустит обе → двойной счёт factHours. Нормализуем сохраняемый date к
// канонической полуночи дня (UTC, 00:00:00.000Z): все записи одного дня получают
// идентичный DATE_TIME → БД-индекс ловит дубль на ЛЮБОМ пути (а не только через
// этот гард). Гард по диапазону дня остаётся (back-compat со старыми записями).
const normalizeEntryDate = (iso: string | undefined): string | undefined =>
  iso ? `${iso.slice(0, 10)}T00:00:00.000Z` : iso;

const findExistingEntryIdByKey = async (key: {
  employeeId: string;
  projectId: string | null;
  workTypeId: string | null;
  date: string;
}): Promise<string | null> => {
  const { from, to } = dayBounds(key.date);
  // date — DATE_TIME: сравниваем по диапазону дня. project/workType nullable →
  // filter `[is]:NULL`, иначе `[eq]:` (точное совпадение по UUID).
  const parts = [
    `employeeId[eq]:${key.employeeId}`,
    `date[gte]:${from}`,
    `date[lte]:${to}`,
    key.projectId ? `projectId[eq]:${key.projectId}` : 'projectId[is]:NULL',
    key.workTypeId ? `workTypeId[eq]:${key.workTypeId}` : 'workTypeId[is]:NULL',
  ];
  const res = await api.get<{ data: { credosTimeEntries: Array<{ id: string }> } }>(
    '/rest/credosTimeEntries',
    { filter: parts.join(','), limit: '1' },
  );
  return res.data?.credosTimeEntries?.[0]?.id ?? null;
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // Один POST-маршрут /s/time-entry; операция выбирается полем `op`.
  const op = params.op ?? 'list';
  // CISO-006: синхронный UUID-guard до сетевого resolveEmployeeId — fail fast.
  if (params.id && !isUuid(params.id)) return { ok: false, error: 'invalid id' };
  // CISO-005: серверный actor («кто действует достоверно»). При TRUSTED-акторе он же
  // источник личности для CRUD (on-behalf-gate ниже); при NULL/untrusted (dev/legacy
  // без server-identity) деградируем на resolveEmployeeId — текущее поведение, записи
  // пишутся как раньше. См. shared/resolve-actor + shared/can-write-for.
  const actor: Actor = await resolveActor(event, params.workspaceMemberRef);

  // ON-BEHALF (MANAGER_ENTRY_ON_BEHALF §3.1): целевой сотрудник записи.
  //   · trusted actor → target = client params.employeeId (ввод ЗА другого), иначе
  //     сам actor (свой ввод). Если target ≠ actor → требуем canWriteFor, иначе
  //     FORBIDDEN_ON_BEHALF; при on-behalf стампим enteredByActor = actor.employeeId.
  //   · actor null/untrusted → деградация: employeeId из resolveEmployeeId, gate
  //     НЕ применяется (dev-flow не ломаем), enteredByActor не пишем.
  // Целевой employeeId для upsert (delete берёт target из существующей записи ниже).
  const clientTargetEmployeeId =
    params.employeeId && isUuid(params.employeeId) ? params.employeeId : null;
  const employeeId =
    actor?.trusted
      ? clientTargetEmployeeId ?? actor.employeeId
      : await resolveEmployeeId(params.workspaceMemberRef);
  // enteredByActor проставляется ТОЛЬКО при on-behalf (trusted actor пишет за ≠ себя).
  const isOnBehalf = !!actor?.trusted && !!employeeId && employeeId !== actor.employeeId;

  // delete — удаление записи по id.
  if (op === 'delete') {
    if (!params.id) return { ok: false, error: 'id required' };
    // CISO-006: id идёт в REST-путь — только UUID (защита от инъекции в path).
    if (!isUuid(params.id)) return { ok: false, error: 'invalid id' };
    // Читаем status + projectId + hours + date до удаления (CISO-011 guard +
    // rollup пересчёт + AUDIT-LOG: oldHours/entryDate для строки журнала).
    const preRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string; hours: number | null; date: string | null; employeeId: string | null }> } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${params.id}`, limit: '1' },
    );
    const preEntry = preRes.data?.credosTimeEntries?.[0];
    // CISO-011: согласованные записи нельзя удалять — целостность табеля/1С.
    if (preEntry?.status === ENTRY_STATUS.APPROVED) {
      return { ok: false, error: 'cannot_modify_approved' };
    }
    // ON-BEHALF-gate (delete): trusted actor удаляет ЧУЖУЮ запись (владелец ≠ actor) →
    // требуем canWriteFor (руководитель отдела / PM проекта / админ), иначе FORBIDDEN.
    // actor null/untrusted → деградация (gate не применяется). Свой delete — всегда ок.
    if (actor?.trusted) {
      const targetOwner = preEntry?.employeeId ?? null;
      if (targetOwner && targetOwner !== actor.employeeId) {
        const allowed = await canWriteFor(actor, targetOwner, {
          projectId: preEntry?.projectId ?? null,
        });
        if (!allowed) return { ok: false, error: 'FORBIDDEN_ON_BEHALF' };
      }
    }
    // PERIOD-LOCKDOWN (2-е правило guard, SSOT с CISO-011): удаление записи в
    // ЗАКРЫТОМ периоде запрещено всем, КРОМЕ руководителя (override, логируется).
    const { lockdown } = await readSettings();
    const delGate = canMutateInPeriod(preEntry?.date ?? null, lockdown, actor);
    if (!delGate.allowed) {
      return { ok: false, error: 'LOCKED_PERIOD' };
    }
    const deletedProjectId = preEntry?.projectId ?? null;
    await api.delete(`/rest/credosTimeEntries/${params.id}`);
    // AUDIT-LOG (action=DELETE): кто удалил + сколько часов было. Пишется ДО
    // recalc (entry уже снесён в REST, но строка лога с entryId успеет лечь
    // перед CASCADE-сносом связанных логов на следующих операциях; deletedProjectId
    // recalc не зависит от лога). Побочно — не роняет операцию.
    await writeEntryLog(actor, {
      entryId: params.id,
      action: 'DELETE',
      oldHours: preEntry?.hours ?? null,
      newHours: null,
      entryDate: preEntry?.date ?? null,
      // reopen-аудит: удаление в закрытом периоде руководителем (override).
      override: delGate.isOverride,
    });
    if (deletedProjectId && isUuid(deletedProjectId)) {
      await recalcProjectFactHours(deletedProjectId);
    }
    return { ok: true };
  }

  // upsert — создать или обновить запись.
  if (op === 'upsert') {
    // CISO-006: id в REST-путь PATCH — только UUID. Проверяем ДО резолва сотрудника,
    // чтобы невалидный id сразу падал на 'invalid id', а не на 'employee not resolved'.
    if (params.id && !isUuid(params.id)) return { ok: false, error: 'invalid id' };

    // CISO-011: для существующей записи читаем status+projectId РАНЬШЕ проверок
    // часов/сотрудника. Согласованную запись нельзя менять независимо от резолва
    // актора — иначе 'employee not resolved'/'hours out of range' маскируют guard
    // целостности. Один GET; prevProjectId переиспользуем ниже для rollup-пересчёта.
    let prevProjectId: string | null = null;
    // AUDIT-LOG: часы ДО правки (для diff oldHours→newHours в строке журнала).
    // null = новая запись (create), не было прежнего значения.
    let prevHours: number | null = null;
    if (params.id) {
      const prevRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string; hours: number | null }> } }>(
        '/rest/credosTimeEntries',
        { filter: `id[eq]:${params.id}`, limit: '1' },
      );
      const prevEntry = prevRes.data?.credosTimeEntries?.[0];
      if (prevEntry?.status === ENTRY_STATUS.APPROVED) {
        return { ok: false, error: 'cannot_modify_approved' };
      }
      prevProjectId = prevEntry?.projectId ?? null;
      prevHours = prevEntry?.hours ?? null;
    }

    const hours = Number(params.hours);
    // WI-52 / W5C.27: пустая запись (hours<=0 / NaN) не сохраняется — иначе держит
    // уникальный ключ (emp,proj,wt,date), блокируя реальную, но в факт не идёт
    // (reports-calc: `if (hours===0) continue`). UI на 0 удаляет запись (commitCell);
    // сервер — источник истины: отклоняем ERROR. Проверяем РАНЬШЕ лимита/переработки
    // и резолва сотрудника (пустую запись валидируем независимо от прочего).
    const positiveHours = validatePositiveHours(hours);
    if (positiveHours) {
      return { ok: false, error: 'hours must be positive', validation: positiveHours };
    }
    // gap-аудит v3 #4: валидация как данные + уровни. Пороги из settings.
    // ERROR (лимит часов/день) блокирует операцию; WARNING (переработка) —
    // не блок, флаг в ответе. validateEntry — чистая (constants/validation).
    // PERIOD-LOCKDOWN: lockdown-конфиг приходит ТЕМ ЖЕ GET (без лишнего запроса).
    const { thresholds, lockdown } = await readSettings();
    // PERIOD-LOCKDOWN (2-е правило guard, SSOT с CISO-011): create/update записи в
    // ЗАКРЫТОМ периоде запрещены всем, КРОМЕ руководителя (override, логируется).
    // Дата записи — params.date (та, что сохраняем). Проверяем ДО мутаций и резолва
    // ключа: закрытый период не зависит от наличия employee/ключа.
    const upsertGate = canMutateInPeriod(params.date ?? null, lockdown, actor);
    if (!upsertGate.allowed) {
      return { ok: false, error: 'LOCKED_PERIOD' };
    }
    const findings = validateEntry({ hours }, thresholds);
    const blocking = findings.find((f) => f.level === 'error');
    if (blocking) {
      // back-compat: code/error остаётся 'hours out of range' для старых клиентов,
      // плюс структурный validation-блок {level, code, message}.
      return { ok: false, error: 'hours out of range', validation: blocking };
    }
    // Несблокирующие предупреждения (переработка) — отдаём списком в ответе.
    const warnings = findings.filter((f) => f.level === 'warning');
    if (!employeeId) return { ok: false, error: 'employee not resolved' };

    const newProjectId = params.projectId && isUuid(params.projectId) ? params.projectId : null;
    const newWorkTypeId = params.workTypeId && isUuid(params.workTypeId) ? params.workTypeId : null;

    // ON-BEHALF-gate (upsert): trusted actor пишет ЗА другого (employeeId ≠ actor) →
    // требуем canWriteFor (руководитель отдела / PM проекта / админ), иначе FORBIDDEN.
    // Свой ввод (employeeId == actor) проходит без проверки. actor null/untrusted →
    // деградация: gate пропущен (dev-flow не ломаем). isOnBehalf вычислен на входе.
    if (isOnBehalf && actor) {
      const allowed = await canWriteFor(actor, employeeId, { projectId: newProjectId });
      if (!allowed) return { ok: false, error: 'FORBIDDEN_ON_BEHALF' };
    }

    const data: Record<string, unknown> = {
      // WI-51: нормализуем к полуночи дня (UTC) → совпадение DATE_TIME для всех
      // записей одного дня, БД-индекс ловит дубль. params.date гарантирован выше.
      date: normalizeEntryDate(params.date),
      hours,
      description: params.description ?? null,
      employeeId,
      projectId: newProjectId,
      workTypeId: newWorkTypeId,
      // ON-BEHALF-аудит: кто ВНЁС, если ≠ владелец (руководитель/PM/админ). При
      // самостоятельном вводе (или деградации) NULL — обычная запись. Питает
      // UI-пометку «введено X за Y» + audit. ADDITIVE-поле credos-time-entry.
      enteredByActor: isOnBehalf && actor ? actor.employeeId : null,
    };

    // SCOUT-B upsert-семантика: если id не передан, ищем существующую запись по
    // ключу (employee, project, workType, день) → обновляем её вместо создания
    // (не плодим дубли). Закрывает NULL-щель уникального индекса и даёт чистый
    // upsert для CSV-импорта/повторного ввода вместо 500 от БД-констрейнта.
    let targetId = params.id ?? null;
    if (!targetId && params.date) {
      targetId = await findExistingEntryIdByKey({
        employeeId,
        projectId: newProjectId,
        workTypeId: newWorkTypeId,
        date: params.date,
      });
      // Найденную по ключу запись тоже защищаем (CISO-011) и собираем её проект
      // для пересчёта (смены проекта тут быть не может — ключ совпадает).
      if (targetId) {
        const exRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string; hours: number | null }> } }>(
          '/rest/credosTimeEntries',
          { filter: `id[eq]:${targetId}`, limit: '1' },
        );
        const ex = exRes.data?.credosTimeEntries?.[0];
        if (ex?.status === ENTRY_STATUS.APPROVED) {
          return { ok: false, error: 'cannot_modify_approved' };
        }
        prevProjectId = ex?.projectId ?? null;
        prevHours = ex?.hours ?? null;
      }
    }

    if (targetId) {
      const res = await api.patch<{ data: { updateCredosTimeEntry: TimeEntry } }>(
        `/rest/credosTimeEntries/${targetId}`,
        data,
      );
      // AUDIT-LOG (action=UPDATE): diff часов prevHours→hours. Пишется только при
      // реальном изменении часов (если часы те же — правка прочих полей, не diff
      // часов; лог часов не плодим). Побочно — не роняет операцию.
      if (prevHours !== hours) {
        await writeEntryLog(actor, {
          entryId: targetId,
          action: 'UPDATE',
          oldHours: prevHours,
          newHours: hours,
          entryDate: data.date as string | undefined,
          // reopen-аудит: правка в закрытом периоде руководителем (override).
          override: upsertGate.isOverride,
        });
      }
      const projectIdsToRecalc = new Set<string>(
        [prevProjectId, newProjectId].filter((id): id is string => !!id && isUuid(id)),
      );
      for (const pid of projectIdsToRecalc) await recalcProjectFactHours(pid);
      return {
        ok: true,
        entry: res.data?.updateCredosTimeEntry,
        ...(warnings.length ? { warnings } : {}),
      };
    }
    const res = await api.post<{ data: { createCredosTimeEntry: TimeEntry } }>(
      '/rest/credosTimeEntries',
      data,
    );
    const createdEntry = res.data?.createCredosTimeEntry;
    // AUDIT-LOG (action=CREATE): newHours новой записи + кто создал. Native
    // createdBy/createdAt ядра уже фиксируют «кто/когда создал»; строку CREATE
    // пишем для единого читаемого реестра действий + diff-семантики (oldHours=null).
    await writeEntryLog(actor, {
      entryId: createdEntry?.id ?? null,
      action: 'CREATE',
      oldHours: null,
      newHours: hours,
      entryDate: data.date as string | undefined,
      // reopen-аудит: создание задним числом в закрытом периоде руководителем.
      override: upsertGate.isOverride,
    });
    if (newProjectId) await recalcProjectFactHours(newProjectId);
    return {
      ok: true,
      entry: createdEntry,
      ...(warnings.length ? { warnings } : {}),
    };
  }

  // GET (по умолчанию) — список записей за неделю + справочники для сетки.
  // CISO-006: from/to идут в filter-строку — валидируем ISO-date (инъекция → ошибка).
  const from = params.from ?? '1970-01-01T00:00:00.000Z';
  const to = params.to ?? '2999-12-31T23:59:59.999Z';
  if (!isIsoDate(from) || !isIsoDate(to)) return { ok: false, error: 'invalid from/to' };

  const entriesFilter = employeeId
    ? `date[gte]:${from},date[lte]:${to},employeeId[eq]:${employeeId}`
    : `date[gte]:${from},date[lte]:${to}`;

  const [entriesRes, projectsRes, workTypesRes] = await Promise.all([
    api.get<{ data: { credosTimeEntries: TimeEntry[] } }>('/rest/credosTimeEntries', {
      filter: entriesFilter,
      limit: '200',
      orderBy: 'date[AscNullsFirst]',
    }),
    api.get<{ data: { credosTimeProjects: RefItem[] } }>('/rest/credosTimeProjects', {
      filter: 'status[eq]:ACTIVE',
      limit: '200',
      orderBy: 'code[AscNullsFirst]',
    }),
    api.get<{ data: { credosTimeWorkTypes: RefItem[] } }>('/rest/credosTimeWorkTypes', {
      limit: '200',
    }),
  ]);

  return {
    ok: true,
    employeeId,
    entries: entriesRes.data?.credosTimeEntries ?? [],
    projects: (projectsRes.data?.credosTimeProjects ?? []).map((p) => ({
      id: p.id,
      name: p.name, // UX-5: name уже содержит код после пересева (код — клиент — название)
    })),
    workTypes: (workTypesRes.data?.credosTimeWorkTypes ?? []).map((w) => ({
      id: w.id,
      name: w.name,
    })),
  };
};

// Обёртка: ошибки превращаем в ok:false с диагностикой (роут не падает 500).
const handler = async (event: RoutePayload) => {
  try {
    return await run(event);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      apiBase: apiBase(),
      hasToken: Boolean(process.env.TWENTY_APP_ACCESS_TOKEN),
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'time-entry-api',
  description: 'CRUD трудозатрат за неделю для недельной сетки (front-компонент)',
  timeoutSeconds: 10,
  handler,
  httpRouteTriggerSettings: {
    path: '/time-entry',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
