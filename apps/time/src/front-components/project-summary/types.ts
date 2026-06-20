// Сводка по проекту (1-я вкладка карточки): ключевые метрики из проекта + записей.

export type ProjectSummary = {
  code: string | null;
  name: string;
  category: string | null; // UPPER_CASE
  status: string | null; // UPPER_CASE
  startDate: string | null;
  endDate: string | null;
  plannedEffort: number | null; // план, ч
  fact: number; // факт = Σ часов записей
  team: number; // уникальных сотрудников
  entries: number; // число записей
  stages: number; // число этапов
  lastDate: string | null; // последняя активность
};
