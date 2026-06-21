import { departmentLabel } from 'src/constants/labels';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import type { OlapDim } from 'src/front-components/reports/olap-types';

// SSOT осей drill-down отчётов: человекочитаемый ярлык оси + ярлык значения для
// крошек/чипов + «естественная» следующая ось при провале строки. UI-уровень:
// бэкенд отдаёт UPPER_CASE-коды (category/workTypeGroup), здесь маппим в русское.

// Ярлык оси (заголовок колонки / подпись фильтра).
const DIM_LABEL: Record<OlapDim, string> = {
  dept: 'Отдел',
  employee: 'Сотрудник',
  project: 'Проект',
  workType: 'Вид работ',
  workTypeGroup: 'Группа работ',
  category: 'Категория',
  stage: 'Этап',
};

export const dimLabel = (dim: OlapDim): string => DIM_LABEL[dim] ?? dim;

// Ось drill по умолчанию при клике строки данной оси. Сходится к самому дробному
// срезу: отдел→проекты→сотрудники; проект→сотрудники; группа→виды; категория→
// проекты. Возвращаем первую доступную из предпочтений (бэк отдаёт drillable[]).
const PREFERRED_NEXT: Record<OlapDim, OlapDim[]> = {
  dept: ['project', 'employee', 'category'],
  project: ['employee', 'workType', 'category'],
  employee: ['project', 'workType', 'category'],
  workTypeGroup: ['workType', 'project'],
  workType: ['employee', 'project'],
  category: ['project', 'employee'],
  stage: ['employee', 'project'],
};

// Следующая ось для строки оси `from`, ограниченная теми, куда реально можно
// провалиться (drillable от бэка). null → строка не кликабельна (тупик).
export const nextAxis = (from: OlapDim, drillable: OlapDim[]): OlapDim | null => {
  const avail = new Set(drillable.filter((d) => d !== 'stage'));
  for (const cand of PREFERRED_NEXT[from] ?? []) if (avail.has(cand)) return cand;
  return null;
};

// Ярлык значения измерения для крошки/чипа. `display` — отображаемая подпись
// строки (для dept = код отдела, для остальных = name). dept/category берут
// справочник; иначе показываем display как есть. value (id/код) — для фильтра, не
// для показа: dept-строка несёт id в key, но КОД в name → лейбл по коду (display).
export const valueLabel = (dim: OlapDim, value: string, display: string): string => {
  if (dim === 'dept') return departmentLabel(display, { short: true }) || display || value;
  if (dim === 'category') return categoryMeta(value).label || categoryMeta(display).label;
  return display || value;
};
