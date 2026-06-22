// Настройки модуля Time Credos. v1 — конфигурация на полях credosTimeDepartment
// (согласование, коэффициент ёмкости). Численность не хранится — вычисляется как
// count активных сотрудников отдела (см. fetchHeadcounts). Глобальный singleton
// отложен (Dev 2: credosTimeSettings, если появятся глобальные параметры).

export type DeptSettings = {
  id: string;
  name: string;
  code: string | null;
  approvalRequired: boolean; // требовать согласование трудозатрат
  capacityFactor: number; // коэффициент ёмкости (отпуска/накладные), напр. 0.8
};

// Вычисляемая численность: deptId → число активных сотрудников.
export type Headcounts = Record<string, number>;

// REQ-0019 — глобальные настройки модуля (singleton credosTimeSettings, 1 запись).
// 12 параметров: ввод/норма, планирование, согласование, напоминания, безопасность.
// SELECT-значения хранятся в UPPER_SNAKE (как в select-options), числа — как есть.
export type GlobalSettings = {
  id: string;
  // Ввод / норма
  normHoursPerDay: number;
  fillTemplateHours: number;
  overtimeWarnHours: number;
  maxHoursPerDay: number; // жёсткий лимит часов/день (ERROR при превышении)
  minHoursPerWeek: number; // минимум часов/неделю (WARNING недобора; 0 = выкл)
  warnOnScheduleDeviation: boolean; // показывать предупреждения переработки/недобора
  // Планирование
  weekStartsOn: string;
  planningHorizonWeeks: number;
  defaultCapacityFactor: number;
  tentativeBookingEnabled: boolean;
  // Согласование
  defaultApprovalRequired: boolean;
  approvalPeriod: string;
  // Закрытие периода (PERIOD-LOCKDOWN). lockdownDate=null → выключено.
  // Записи с датой ≤ (lockdownDate − lockdownGraceDays) read-only (кроме руководителя).
  lockdownDate: string | null; // ISO 'YYYY-MM-DD' или null (выкл)
  lockdownGraceDays: number; // грейс-окно в днях (≥0): сдвигает границу назад
  // Напоминания
  reminderEnabled: boolean;
  reminderDayOfWeek: string;
  // Безопасность (ПДн)
  revealEmployeeNames: boolean;
};
