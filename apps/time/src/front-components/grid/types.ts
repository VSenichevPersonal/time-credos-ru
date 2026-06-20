// Общие типы недельной сетки (front + ответ /s/time-entry).

export type Ref = { id: string; name: string };

export type ApiEntry = {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  projectId: string | null;
  workTypeId: string | null;
};

export type GridResponse = {
  ok: boolean;
  employeeId: string | null;
  entries: ApiEntry[];
  projects: Ref[];
  workTypes: Ref[];
};

// Строка сетки = пара (проект + вид работ).
export type RowKey = string; // `${projectId}|${workTypeId}`

export const makeRowKey = (projectId: string, workTypeId: string): RowKey =>
  `${projectId}|${workTypeId}`;

export const splitRowKey = (key: RowKey): { projectId: string; workTypeId: string } => {
  const [projectId, workTypeId] = key.split('|');
  return { projectId, workTypeId };
};
