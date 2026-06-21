import { useReducer } from 'react';

// Состояние drill-down для отчётов/планирования (research §2.2): стек уровней в
// React-памяти (без URL/host-DOM — песочница, PLAYBOOK §9). Каждый уровень несёт
// измерение, по которому провалились, значение-фильтр и человекочитаемую крошку.

export type DrillLevel = {
  dim: string; // измерение, по которому провалились (напр. 'dept')
  value: string; // ключ-фильтр дочернего среза (напр. deptId)
  label: string; // крошка («Отдел: ОПИБ»)
  valueLabel?: string; // только значение без оси («ОПИБ») — для cross-filter-пилюль
  childAxis?: string; // ось дочернего среза, показываемого ПОСЛЕ этого провала
};

export type DrillState = {
  stack: DrillLevel[]; // [] = корень (срез верхнего уровня)
};

export type DrillAction =
  | { type: 'into'; level: DrillLevel }
  | { type: 'goTo'; index: number } // обрезать стек до уровня i (крошка)
  | { type: 'reset' };

// Экспортируем редьюсер для юнит-тестов (хук требует React-окружения).
export const drillReducer = (state: DrillState, action: DrillAction): DrillState => {
  switch (action.type) {
    case 'into':
      return { stack: [...state.stack, action.level] };
    case 'goTo':
      return { stack: state.stack.slice(0, action.index) };
    case 'reset':
      return { stack: [] };
    default:
      return state;
  }
};

export const useDrill = () => {
  const [state, dispatch] = useReducer(drillReducer, { stack: [] });
  return {
    stack: state.stack,
    drillInto: (level: DrillLevel) => dispatch({ type: 'into', level }),
    goToLevel: (index: number) => dispatch({ type: 'goTo', index }),
    reset: () => dispatch({ type: 'reset' }),
  };
};
