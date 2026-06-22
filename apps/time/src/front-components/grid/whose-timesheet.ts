import type { DepartmentRef, EmployeeRef } from 'src/front-components/grid/types';

// «Чей это таймшит» — контекст-индикатор над сеткой (REQ on-behalf #1, read-only).
// Всегда видно ФИО + отдел сотрудника, чьи часы показаны — даже когда это свой
// таймшит. Подготовка к on-behalf: когда руководитель будет вводить за других,
// тот же индикатор покажет, ЗА КОГО ведётся ввод (через тот же employeeId).
//
// ПДн (CISO-007, 152-ФЗ): ФИО показываем ТОЛЬКО при revealEmployeeNames=true.
// Иначе — стабильный КОД сотрудника «Сотрудник·XXXX» (без ПДн, как actor-names).
// Тот же контракт reveal, что в аудит-подписях полосы согласования.

// Стабильный КОД без ПДн: последние 4 hex-символа id (UI-локальный, совпадает
// с actor-names.actorLabel — единый формат кода по всему виджету).
const employeeCode = (id: string): string => {
  const suffix = id.replace(/[^0-9a-fA-F]/g, '').slice(-4).toUpperCase();
  return `Сотрудник·${suffix || id.slice(0, 4)}`;
};

// Чистая функция: подпись владельца таймшита. reveal=true → ФИО (employee.name —
// labelIdentifier карточки сотрудника), иначе — КОД без ПДн. Пустое ФИО при
// reveal → откат на КОД.
export const ownerName = (employee: EmployeeRef, reveal: boolean): string => {
  if (reveal) {
    const name = employee.name?.trim();
    if (name) return name;
  }
  return employeeCode(employee.id);
};

// Чистая функция: название отдела сотрудника по справочнику. Нет привязки /
// отдел не найден → null (подпись покажет только ФИО/КОД, без «· отдел»).
export const ownerDepartment = (
  employee: EmployeeRef,
  departments: ReadonlyArray<DepartmentRef>,
): string | null => {
  if (!employee.departmentId) return null;
  const dept = departments.find((d) => d.id === employee.departmentId);
  const name = dept?.name?.trim();
  return name || null;
};

export type TimesheetOwner = {
  // Подпись (ФИО или КОД) — основной акцент индикатора.
  label: string;
  // Отдел сотрудника (или null, если не привязан/не найден).
  department: string | null;
  // Один из подписи + отдела через разделитель «·» (для title/aria/тестов).
  full: string;
};

// Чистая функция: собрать индикатор владельца из employeeId + справочников.
// employeeId=null (профиль не определён) → null (индикатор не рисуется).
// Сотрудник не найден в справочнике → подпись по КОДу самого id (без ПДн).
export const buildTimesheetOwner = (
  employeeId: string | null,
  employees: ReadonlyArray<EmployeeRef>,
  departments: ReadonlyArray<DepartmentRef>,
  reveal: boolean,
): TimesheetOwner | null => {
  if (!employeeId) return null;
  const employee =
    employees.find((e) => e.id === employeeId) ??
    ({ id: employeeId, name: '', departmentId: null } as EmployeeRef);
  const label = ownerName(employee, reveal);
  const department = ownerDepartment(employee, departments);
  return {
    label,
    department,
    full: department ? `${label} · ${department}` : label,
  };
};
