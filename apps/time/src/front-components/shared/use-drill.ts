import { useReducer } from 'react';

// Состояние drill-down для отчётов/планирования (research §2.2): стек уровней в
// React-памяти (без URL/host-DOM — песочница, PLAYBOOK §9). Каждый уровень несёт
// измерение, по которому провалились, значение-фильтр и человекочитаемую крошку.

export type DrillLevel = {
  dim: string; // измерение, по которому провалились (напр. 'dept')
  value: string; // ключ-фильтр дочернего среза (напр. deptName)
  label: string; // крошка («Отдел: ОПИБ»)
};

export type DrillState = {
  stack: DrillLevel[]; // [] = корень (срез верхнего уровня)
};

type Action =
  | { type: 'into'; level: DrillLevel }
  | { type: 'goTo'; index: number } // обрезать стек до уровня i (крошка)
  | { type: 'reset' };

const reducer = (state: DrillState, action: Action): DrillState => {
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
  const [state, dispatch] = useReducer(reducer, { stack: [] });
  return {
    stack: state.stack,
    drillInto: (level: DrillLevel) => dispatch({ type: 'into', level }),
    goToLevel: (index: number) => dispatch({ type: 'goTo', index }),
    reset: () => dispatch({ type: 'reset' }),
  };
};
