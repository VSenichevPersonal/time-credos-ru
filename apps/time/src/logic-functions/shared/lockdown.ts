import type { Actor } from './resolve-actor';

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD-LOCKDOWN (AUDIT_LOG_PERIOD_LOCKDOWN.md §3.Б): защита прошлых периодов от
// правки по ДАТЕ, независимо от статуса записи. 2-е правило поверх построчного
// APPROVED-lock (CISO-011) — один серверный guard, два правила (SSOT защиты).
//
// Механизм (MVP, [[keep-it-simple]]):
//   · settings.lockdownDate (DATE_TIME|null) — граница закрытия. null = выкл.
//   · settings.lockdownGraceDays (INT≥0) — грейс-окно: эффективная граница
//     сдвигается на graceDays назад (правка ещё разрешена graceDays после даты).
//   · запись с entryDate ≤ эффективной границы (по календарному дню) → закрыта.
//   · ОБХОД (reopen): роль «Руководитель» (actor.isManager). Выделенной admin-роли
//     в модели нет — override деградирует на isManager, как и approval/revoke по
//     всей системе. Follow-up (RBAC-волна): отдельный признак admin.
//   · override-действие ЛОГИРУЕТСЯ в audit-log (write-entry-log, override=true).
//
// АВТОЗАКРЫТИЕ после согласования: построчно уже обеспечено APPROVED-lock
// (CISO-011) — согласованная запись read-only независимо от даты. Авто-сдвиг
// lockdownDate по полностью-согласованным месяцам — follow-up (дорого: скан всех
// записей при каждом approve). MVP: ручной lockdownDate (админ ставит в Settings).
// ─────────────────────────────────────────────────────────────────────────────

export type LockdownConfig = {
  // null = lockdown выключен.
  lockdownDate: string | null;
  graceDays: number;
};

// Чистая функция: закрыта ли дата записи для правки (без учёта роли актора).
// Сравнение по календарному ДНЮ (UTC) — entryDate и lockdownDate нормализуются
// к 'YYYY-MM-DD', грейс вычитается в днях. Любой нечитаемый вход → НЕ закрыто
// (fail-open для самой даты; роль-гард отдельно — guard в целом fail-safe через
// требование валидной даты записи у вызывающего).
export const isPeriodLocked = (
  entryDate: string | null | undefined,
  config: LockdownConfig,
): boolean => {
  if (!config.lockdownDate) return false; // lockdown выкл.
  if (!entryDate) return false; // нет даты записи → не можем судить, не блокируем
  const entryDay = entryDate.slice(0, 10);
  const boundaryDay = config.lockdownDate.slice(0, 10);
  if (entryDay.length !== 10 || boundaryDay.length !== 10) return false;
  // Эффективная граница = lockdownDate − graceDays (грейс сдвигает закрытие назад).
  const grace = Number.isFinite(config.graceDays) && config.graceDays > 0 ? Math.floor(config.graceDays) : 0;
  const boundary = new Date(`${boundaryDay}T00:00:00.000Z`);
  if (Number.isNaN(boundary.getTime())) return false;
  boundary.setUTCDate(boundary.getUTCDate() - grace);
  const effectiveBoundaryDay = boundary.toISOString().slice(0, 10);
  // Закрыто, если день записи ≤ эффективной границы (включительно).
  return entryDay <= effectiveBoundaryDay;
};

// PERIOD-LOCKDOWN для ПЛАНА (plan-slots оперирует месяцем 'YYYY-MM', не датой).
// Месяц считается закрытым, если его ПОСЛЕДНИЙ день ≤ эффективной границы (весь
// месяц в прошлом закрытом периоде). Месяц, частично попадающий в открытое окно,
// НЕ закрываем (план будущего/текущего открыт). Невалидный месяц → не закрыт.
export const isPlanMonthLocked = (
  periodMonth: string | null | undefined,
  config: LockdownConfig,
): boolean => {
  if (!config.lockdownDate) return false;
  if (!periodMonth || !/^\d{4}-\d{2}$/.test(periodMonth)) return false;
  const [y, m] = periodMonth.split('-').map(Number);
  // Последний день месяца = день 0 следующего месяца (UTC).
  const lastDay = new Date(Date.UTC(y, m, 0));
  if (Number.isNaN(lastDay.getTime())) return false;
  return isPeriodLocked(lastDay.toISOString(), config);
};

// Может ли actor править план на месяц (override = руководитель, как и для записей).
export const canMutatePlanMonth = (
  periodMonth: string | null | undefined,
  config: LockdownConfig,
  actor: Actor,
): { allowed: boolean; isOverride: boolean } => {
  if (!isPlanMonthLocked(periodMonth, config)) return { allowed: true, isOverride: false };
  if (actor?.isManager) return { allowed: true, isOverride: true };
  return { allowed: false, isOverride: false };
};

// Может ли actor мутировать запись с данной датой. false → REJECT (LOCKED_PERIOD),
// КРОМЕ роли «Руководитель» (override). actor=null (деградация identity) →
// блокируем в закрытом периоде (нет доверенной роли → не разрешаем обход).
export const canMutateInPeriod = (
  entryDate: string | null | undefined,
  config: LockdownConfig,
  actor: Actor,
): { allowed: boolean; isOverride: boolean } => {
  const locked = isPeriodLocked(entryDate, config);
  if (!locked) return { allowed: true, isOverride: false };
  // Закрыто. Обход — только руководитель (override). Действие логируется вызывающим.
  if (actor?.isManager) return { allowed: true, isOverride: true };
  return { allowed: false, isOverride: false };
};

// Тонкий REST-клиент (нативный fetch серверного рантайма). Локальный — модуль
// самодостаточен и легко мокается в тестах.
const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

type RawSettingsLockdown = {
  lockdownDate?: string | null;
  lockdownGraceDays?: number | null;
};

// Прочитать lockdown-конфиг из singleton credosTimeSettings. Любая ошибка чтения →
// безопасный «выключен» (fail-open: сбой настроек НЕ должен запирать весь ввод).
export const readLockdownConfig = async (): Promise<LockdownConfig> => {
  try {
    const qs = new URLSearchParams({ limit: '1' }).toString();
    const res = await fetch(`${apiBase()}/rest/credosTimeSettings?${qs}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { lockdownDate: null, graceDays: 0 };
    const json = (await res.json()) as {
      data?: { credosTimeSettings?: RawSettingsLockdown[] };
    };
    const s = json.data?.credosTimeSettings?.[0];
    const lockdownDate = typeof s?.lockdownDate === 'string' && s.lockdownDate ? s.lockdownDate : null;
    const graceDays =
      typeof s?.lockdownGraceDays === 'number' && s.lockdownGraceDays > 0
        ? Math.floor(s.lockdownGraceDays)
        : 0;
    return { lockdownDate, graceDays };
  } catch {
    return { lockdownDate: null, graceDays: 0 };
  }
};
