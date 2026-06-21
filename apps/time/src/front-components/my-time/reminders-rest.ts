import { RestApiClient } from 'twenty-client-sdk/rest';

// Вызов детект-роута напоминаний /s/reminders из песочницы виджета (POST, как
// /s/reports). Сервер считает «кто не заполнил текущую неделю» (норма−факт) по
// singleton-настройкам и отдаёт список строк. UI «Мои часы» фильтрует свою
// строку по employeeId, руководитель видит дайджест команды (ФИО при reveal).

const client = () => new RestApiClient();

export type ReminderRow = {
  employeeId: string;
  name: string; // ФИО или '' (CISO-007, при revealEmployeeNames=false)
  deptCode: string;
  norm: number;
  fact: number;
  under: number;
};

export type RemindersResponse = {
  ok: boolean;
  enabled: boolean;
  reminderDayOfWeek: string | null;
  week: { from: string; to: string } | null;
  threshold?: number;
  total: number;
  rows: ReminderRow[];
  error?: string;
};

const EMPTY = (error?: string): RemindersResponse => ({
  ok: false,
  enabled: false,
  reminderDayOfWeek: null,
  week: null,
  total: 0,
  rows: [],
  error,
});

export const fetchReminders = async (): Promise<RemindersResponse> => {
  try {
    const resp = await client().post<RemindersResponse>('/s/reminders', {
      mode: 'missing-timesheets',
    });
    if (!resp?.ok) return EMPTY(resp?.error ?? 'Сервис напоминаний недоступен');
    return resp;
  } catch (e) {
    return EMPTY(e instanceof Error ? e.message : 'Ошибка загрузки напоминаний');
  }
};
