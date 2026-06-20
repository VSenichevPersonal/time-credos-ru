// Общие типы сетки (front + Core REST credosTime*).

export type Ref = { id: string; name: string };

// Проект для сетки/фильтров: код, клиент, отдел, категория.
export type ProjectRef = {
  id: string;
  code: string | null;
  name: string; // «КОД · Клиент · Название»
  rawName: string; // имя проекта без кода/клиента (для поиска)
  client: string | null;
  departmentId: string | null;
  category: string | null; // UPPER_CASE код категории
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
