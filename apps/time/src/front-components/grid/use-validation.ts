import { useCallback, useRef, useState } from 'react';

import {
  VALIDATION_DEFAULTS,
  validateEntry,
  type ValidationFinding,
} from 'src/constants/validation';
import type { MutationResult } from 'src/front-components/grid/time-rest';
import { PERIOD_LOCKED_MESSAGE } from 'src/front-components/grid/period-lock';
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

// Машинный код серверной ошибки /s/time-entry → понятный русский текст (SSOT для
// плашки). Чистая функция — тестируется без рендера. Неизвестный код → общий текст.
export const serverErrorMessage = (error: string | undefined): string => {
  switch (error) {
    case 'cannot_modify_approved':
      return 'Согласовано — правка запрещена. Нужен отзыв согласования.';
    case 'LOCKED_PERIOD':
      return PERIOD_LOCKED_MESSAGE;
    case 'hours out of range':
      return 'Часы за день вне допустимого диапазона';
    case 'employee not resolved':
      return 'Сотрудник не сопоставлен — обратитесь к администратору';
    default:
      return 'Сервер отклонил операцию. Изменение не сохранено.';
  }
};

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

  // CISO-012: показать результат СЕРВЕРНОЙ мутации (/s/time-entry — источник истины).
  // ERROR (cannot_modify_approved / hours out of range / прочее) → красная плашка
  // (держится, пользователь исправляет); WARNING (переработка) → янтарь, авто-гаснет.
  // Возвращает true, если был блокирующий серверный ERROR (вызывающий уже сделал
  // reload — оптимистичный ввод откатился к серверному состоянию).
  const showServerResult = useCallback(
    (result: MutationResult): { blocked: boolean } => {
      // Несблокирующие предупреждения сервера — показываем всегда (даже при ok).
      for (const w of result.warnings ?? []) push(w);
      if (result.ok) return { blocked: false };

      // Блокирующий ERROR. Готовый структурный finding (часы) — как есть;
      // иначе мапим машинный код в русский текст.
      if (result.validation) {
        push(result.validation);
      } else {
        push({
          level: 'error',
          code: 'max_hours_per_day',
          message: serverErrorMessage(result.error),
        });
      }
      return { blocked: true };
    },
    [push],
  );

  return { notices, checkAndNotify, notifyLocked, showServerResult, dismiss };
};
