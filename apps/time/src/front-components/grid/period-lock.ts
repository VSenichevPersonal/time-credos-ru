// PERIOD-LOCKDOWN — UI-индикация закрытого периода в сетке (Dev 1 / фронт-зона).
//
// Серверный гард — источник истины (logic-functions/shared/lockdown.ts:
// canMutateInPeriod → отказ LOCKED_PERIOD). Здесь — ТОЛЬКО визуальная подсказка:
// предупредить до отправки, что день закрыт. Логика дат продублирована намеренно
// и минимально (разделение зон фронт/бэк): фронт не импортирует серверный модуль,
// чтобы не зависеть от его сигнатуры. Семантика та же — день записи закрыт, если
// он ≤ эффективной границы (lockdownDate − graceDays).
//
// fail-open: нечитаемый вход / lockdown выключен → НЕ закрыто (не пугаем зря;
// настоящий запрет всё равно ставит сервер). Сравнение по календарному дню (UTC).

export type LockdownView = {
  lockdownDate: string | null; // 'YYYY-MM-DD' или null (выкл)
  graceDays: number;
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Эффективная граница закрытия = lockdownDate − graceDays ('YYYY-MM-DD').
// null, если lockdown выключен или дата нечитаема.
export const effectiveBoundaryDay = (cfg: LockdownView): string | null => {
  if (!cfg.lockdownDate) return null;
  const boundaryDay = cfg.lockdownDate.slice(0, 10);
  if (!DAY_RE.test(boundaryDay)) return null;
  const grace =
    Number.isFinite(cfg.graceDays) && cfg.graceDays > 0 ? Math.floor(cfg.graceDays) : 0;
  const d = new Date(`${boundaryDay}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - grace);
  return d.toISOString().slice(0, 10);
};

// Закрыт ли день записи (любого статуса) по дате. Чистая функция — SSOT UI-индикации.
export const isDayLockedByPeriod = (
  dayIso: string | null | undefined,
  cfg: LockdownView,
): boolean => {
  if (!dayIso) return false;
  const day = dayIso.slice(0, 10);
  if (!DAY_RE.test(day)) return false;
  const boundary = effectiveBoundaryDay(cfg);
  if (!boundary) return false;
  return day <= boundary; // включительно: день на границе закрыт
};

// Единый текст для тоста/тултипа отказа сервера (LOCKED_PERIOD) и индикации в сетке.
export const PERIOD_LOCKED_MESSAGE = 'Период закрыт для правок. Обратитесь к руководителю.';
export const PERIOD_LOCKED_CELL_TITLE = 'Период закрыт — правка запрещена';
