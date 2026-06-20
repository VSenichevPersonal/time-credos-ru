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
