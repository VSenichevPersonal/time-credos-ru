// DP-0005: ресурсная аллокация. Назначение ресурса (человек/роль) на проект или
// резерв, с диапазоном дат и плановыми часами. Заменяет projectDepartment-долю +
// deptPlan + фикцию «деления поровну» (calc-load employeeLoadCells).

// Тип брони: SOFT — предварительная (пресейл-бронь), HARD — жёсткая (подтверждено).
export type BookingType = 'SOFT' | 'HARD';

// Назначение. employeeId=null → обобщённая роль (roleLabel, плейсхолдер до найма).
// projectId=null → резерв без проекта (бывший deptPlan). departmentId явный — для
// роли/резерва; для именованного сотрудника отдел берётся из самого сотрудника.
export type Assignment = {
  id: string;
  employeeId: string | null;
  roleLabel: string | null;
  projectId: string | null;
  departmentId: string | null;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
  plannedHours: number | null;
  bookingType: BookingType;
};

// Патч назначения (inline-edit карточки «Команда»). undefined-поля не трогаются.
export type AssignmentPatch = {
  employeeId?: string | null;
  roleLabel?: string | null;
  departmentId?: string | null;
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  plannedHours?: number | null;
  bookingType?: BookingType;
};
