import { useEffect, useState } from 'react';

import {
  fetchReminders,
  type ReminderRow,
  type RemindersResponse,
} from 'src/front-components/my-time/reminders-rest';

// Загрузка детекта напоминаний (/s/reminders) для баннера «Мои часы».
// Производные: моя строка недобора (по employeeId) + строки команды (для
// дайджеста руководителю). Напоминания выключены → enabled=false, баннер скрыт.
// Ошибку НЕ показываем как сбой: баннер просто не появляется (мягкая деградация).

export type Reminders = {
  loading: boolean;
  enabled: boolean;
  week: RemindersResponse['week'];
  mine: ReminderRow | null; // моя недозаполненная неделя (или null = всё в норме)
  team: ReminderRow[]; // все недозаполнившие (для дайджеста руководителю)
};

export const useReminders = (employeeId: string | null): Reminders => {
  const [data, setData] = useState<RemindersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchReminders()
      .then((r) => {
        if (alive) setData(r);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const enabled = data?.enabled === true;
  const rows = data?.rows ?? [];
  const mine = employeeId ? rows.find((r) => r.employeeId === employeeId) ?? null : null;

  return {
    loading,
    enabled,
    week: data?.week ?? null,
    mine,
    team: rows,
  };
};
