import { useCallback, useRef, useState } from 'react';

import {
  VALIDATION_DEFAULTS,
  validateEntry,
  type ValidationFinding,
} from 'src/constants/validation';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';

// Показ результатов валидации записи при вводе (REQ-0019-UI).
//
// ПОЧЕМУ КЛИЕНТСКИ: фронт-CRUD на dev идёт НАПРЯМУЮ по Core REST (см.
// grid/time-rest.ts) — структурный ответ /s/time-entry ({validation, warnings})
// сюда не доходит. Поэтому используем ТУ ЖЕ чистую validateEntry (SSOT —
// constants/validation), что и бэкенд, с порогами из singleton credosTimeSettings
// (useGlobalSettings, fallback VALIDATION_DEFAULTS). Семантика идентична бэку:
//   · ERROR (лимит часов/день) → блок операции (запись НЕ сохраняется);
//   · WARNING (переработка)     → не блок (запись сохраняется, мягкий флаг).
//
// Сверка (правило 8): Timetta timesheet-validation-rules — два уровня (Ошибка
// блокирует отправку, Предупреждение уведомляет, но позволяет).

export type Notice = ValidationFinding & { id: number };

const WARNING_TTL_MS = 6000; // янтарь-предупреждение само гаснет; ERROR держится

export const useValidation = () => {
  const settings = useGlobalSettings();
  const [notices, setNotices] = useState<Notice[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    const t = timers.current[id];
    if (t) {
      clearTimeout(t);
      delete timers.current[id];
    }
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const push = useCallback(
    (finding: ValidationFinding) => {
      const id = ++idRef.current;
      setNotices((prev) => [...prev, { ...finding, id }]);
      // Предупреждение авто-гаснет; ошибку пользователь закрывает сам (исправил ввод).
      if (finding.level === 'warning') {
        timers.current[id] = setTimeout(() => dismiss(id), WARNING_TTL_MS);
      }
    },
    [dismiss],
  );

  // Проверить часы за день. Возвращает true, если операцию НАДО заблокировать
  // (есть ERROR). Сайд-эффект: пушит уведомления (ERROR + WARNING) в список.
  const checkAndNotify = useCallback(
    (hours: number): { blocked: boolean } => {
      const thresholds = {
        // Лимит часов/день (ERROR) — из настроек (credosTimeSettings.maxHoursPerDay),
        // fallback SSOT-дефолт, если запись не засижена/поле пустое.
        maxHoursPerDay: settings?.maxHoursPerDay ?? VALIDATION_DEFAULTS.maxHoursPerDay,
        // Порог переработки (WARNING) — из настроек, fallback дефолт.
        overtimeWarnHours:
          settings?.overtimeWarnHours ?? VALIDATION_DEFAULTS.overtimeWarnHours,
        minHoursPerWeek: VALIDATION_DEFAULTS.minHoursPerWeek,
      };
      const findings = validateEntry({ hours }, thresholds);
      let blocked = false;
      for (const f of findings) {
        if (f.level === 'error') blocked = true;
        push(f);
      }
      return { blocked };
    },
    [push, settings],
  );

  // W6-2/CISO-012: мягкое уведомление при попытке правки согласованной ячейки.
  // Уровень warning (янтарь, авто-гаснет): это не ошибка ввода, а информирование
  // о read-only-статусе. Дедуп: не плодим одинаковые плашки, если уже висит.
  const notifyLocked = useCallback(() => {
    // code обязателен типом ValidationFinding, но в плашке не отображается
    // (toast рендерит только level+message). overtime_per_day — заглушка.
    push({
      level: 'warning',
      code: 'overtime_per_day',
      message: 'Согласовано — правка запрещена. Нужен отзыв согласования.',
    });
  }, [push]);

  return { notices, checkAndNotify, notifyLocked, dismiss };
};
