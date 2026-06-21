// Общие типы сетки (front + Core REST credosTime*).

export type Ref = { id: string; name: string };

// Проект для сетки/фильтров: код, клиент, отдел, категория.
export type ProjectRef = {
  id: string;
  code: string | null;
  name: string; // отображаемое имя; после пере-сида = «КОД · Клиент · Название»
  rawName: string; // сырое имя проекта из БД (резерв для поиска/диагностики)
  client: string | null;
  departmentId: string | null;
  category: string | null; // UPPER_CASE код категории
  approvalRequired: boolean | null; // null = наследует отдел
};

// Отдел: id, имя, флаг согласования (для резолва на фронте).
export type DepartmentRef = {
  id: string;
  name: string;
  approvalRequired: boolean | null;
};

// Вид работ: имя, группа, отдел (nullable = глобальный).
export type WorkTypeRef = {
  id: string;
  name: string;
  group: string | null; // UPPER_CASE код группы
  departmentId: string | null;
};

export type EmployeeRef = {
  id: string;
  name: string;
  departmentId: string | null;
};

export type ApiEntry = {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status?: string | null; // UPPER_CASE код статуса согласования
  rejectComment?: string | null; // UC-APR-05: причина отклонения (показ сотруднику)
  // WI-56 аудит решения/отзыва. Значение = userWorkspaceId актора (UUID, server-truth),
  // НЕ ФИО — резолв в подпись через actor-names.fetchActorNames (по employee.userWorkspaceRef).
  resolvedBy?: string | null; // кто вынес решение (approve/reject) — показ при REJECTED
  revokedBy?: string | null; // кто отозвал согласование (revoke) или отправку (recall)
  tags?: string[] | null; // W3-2: теги записи (MULTI_SELECT, коды EntryTag)
  projectId: string | null;
  workTypeId: string | null;
  employeeId?: string | null;
};

// Строка сетки = пара (проект + вид работ).
export type RowKey = string; // `${projectId}|${workTypeId}`

export const makeRowKey = (projectId: string, workTypeId: string): RowKey =>
  `${projectId}|${workTypeId}`;

export const splitRowKey = (key: RowKey): { projectId: string; workTypeId: string } => {
  const [projectId, workTypeId] = key.split('|');
  return { projectId, workTypeId };
};

export type ViewMode = 'day' | 'week' | 'project';
