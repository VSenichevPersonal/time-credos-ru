import { useCallback, useEffect, useState } from 'react';

import {
  fetchReminders,
  type ReminderRow,
  type RemindersResponse,
} from 'src/front-components/my-time/reminders-rest';

// Загрузка детекта «Незаполненные таймшиты» (/s/reminders, mode=missing-timesheets)
// для сводной таблицы руководителю в «Отчётах».
//
// КОНТРАКТ (см. reminders.logic.ts): бэк считает ТЕКУЩУЮ неделю (норма−факт),
// период-селектор дашборда сюда НЕ применяется (Timetta-подобно: статус заполнения
// за текущий период). Поэтому хук не принимает from/to — неделю отдаёт сервер.
//
// Состояния (impeccable product): loading (скелетон), error (ретрай),
// enabled=false (напоминания выключены в настройках), пустой список (все заполнили).

export type MissingState = {
  loading: boolean;
  error: string | null;
  enabled: boolean;
  week: RemindersResponse['week'];
  rows: ReminderRow[];
  reload: () => void;
};

export const useMissing = (): MissingState => {
  const [data, setData] = useState<RemindersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchReminders()
      .then((r) => {
        if (!alive) return;
        // ok=false → EMPTY с error: показываем как сбой (в отличие от баннера
        // «Мои часы», здесь раздел открыт намеренно — нужен явный ретрай).
        if (!r.ok && r.error) setError(r.error);
        setData(r);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  return {
    loading,
    error,
    enabled: data?.enabled === true,
    week: data?.week ?? null,
    rows: data?.rows ?? [],
    reload,
  };
};
