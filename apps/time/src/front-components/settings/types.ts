// Настройки модуля Time Credos. v1 — конфигурация на полях credosTimeDepartment
// (согласование, коэффициент ёмкости, численность). Глобальный singleton отложен
// (Dev 2: заведём credosTimeSettings, если появятся реально глобальные параметры).

export type DeptSettings = {
  id: string;
  name: string;
  code: string | null;
  approvalRequired: boolean; // требовать согласование трудозатрат
  capacityFactor: number; // коэффициент ёмкости (отпуска/накладные), напр. 0.8
  headcount: number; // численность (для расчёта ёмкости)
};
