import { useEffect, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';

import type { EmployeeRef } from 'src/front-components/grid/types';

// On-behalf селектор «за кого» (MANAGER_ENTRY_ON_BEHALF): список подчинённых
// руководителя для выбора чужого таймшита. Подчинённые = сотрудники из отделов,
// которыми руководит текущий сотрудник (Department.head = я).
//
// КЛИЕНТ-ФИЛЬТР — это UX, НЕ защита. Сервер (canWriteFor в /s/time-entry +
// /s/plan-slots) — источник истины: чужого подчинённого он отклонит FORBIDDEN_ON_BEHALF
// даже если он как-то попал в список. Здесь лишь не показываем заведомо недоступных.
//
// Чтение read-only по Core REST (как time-rest.fetch*) — серверный гард не нужен.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

// UUID-гард (CISO-006): employeeId интерполируется в filter — только UUID.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ManagedDepartment = { id: string; headId?: string | null };

// Чистая функция: отделы, которыми руковожу Я (headId === мой employeeId).
// Не-руководитель / нет своего id → пустой список (селектор скрыт).
export const departmentsHeadedBy = (
  managerEmployeeId: string | null,
  departments: ReadonlyArray<ManagedDepartment>,
): string[] => {
  if (!managerEmployeeId) return [];
  return departments
    .filter((d) => d.headId === managerEmployeeId)
    .map((d) => d.id);
};

// Чистая функция: подчинённые = активные сотрудники из подведомственных отделов,
// КРОМЕ самого руководителя (себя выбирают через «Вернуться к своему»).
// Сортировка по ФИО (стабильный список в дропдауне). departmentIds пуст → [].
export const subordinatesOf = (
  managerEmployeeId: string | null,
  managedDepartmentIds: ReadonlyArray<string>,
  employees: ReadonlyArray<EmployeeRef>,
): EmployeeRef[] => {
  if (managedDepartmentIds.length === 0) return [];
  const deptSet = new Set(managedDepartmentIds);
  return employees
    .filter(
      (e) =>
        e.id !== managerEmployeeId &&
        e.departmentId !== null &&
        deptSet.has(e.departmentId),
    )
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));
};

// Чистая функция: запись введена руководителем (on-behalf), если enteredByActor
// задан и НЕ совпадает с владельцем записи (employeeId). Пусто / сам ввёл → false.
export const isEnteredByManager = (
  enteredByActor: string | null | undefined,
  ownerEmployeeId: string | null | undefined,
): boolean => {
  const actor = enteredByActor?.trim();
  if (!actor) return false;
  return actor !== (ownerEmployeeId ?? '');
};

// Сырой отдел из Core REST (для headId-резолва — отдельный fetch, т.к.
// fetchDepartments в time-rest не тянет headId).
type RawDept = { id: string; headId?: string | null };

// Тянет id отделов, которыми руководит сотрудник. Точечный фильтр headId[eq]
// (паттерн resolveSelfEmployee). Не-UUID / ошибка → пустой список (селектор скрыт).
export const fetchManagedDepartmentIds = async (
  managerEmployeeId: string | null,
): Promise<string[]> => {
  if (!managerEmployeeId || !UUID_RE.test(managerEmployeeId)) return [];
  try {
    const resp = await client().get<ListResp<RawDept>>('/rest/credosTimeDepartments', {
      query: { filter: `headId[eq]:${managerEmployeeId}`, limit: '50' },
    });
    return pickList(resp, 'credosTimeDepartments').map((d) => d.id);
  } catch {
    return []; // сеть/права упали — селектор не показываем (деградация, не отказ)
  }
};

// Хук: список подчинённых руководителя для on-behalf-селектора. Грузит
// подведомственные отделы (headId=я) + фильтрует справочник сотрудников.
// Не-руководитель / нет своего id → пустой список (вызывающий прячет селектор).
// Песочница-safe (только REST).
export const useSubordinates = (
  managerEmployeeId: string | null,
  isManager: boolean,
  employees: ReadonlyArray<EmployeeRef>,
): EmployeeRef[] => {
  const [deptIds, setDeptIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isManager || !managerEmployeeId) {
      setDeptIds([]);
      return;
    }
    let alive = true;
    void fetchManagedDepartmentIds(managerEmployeeId).then((ids) => {
      if (alive) setDeptIds(ids);
    });
    return () => {
      alive = false;
    };
  }, [managerEmployeeId, isManager]);

  return subordinatesOf(managerEmployeeId, deptIds, employees);
};
