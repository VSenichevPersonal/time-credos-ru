import { useCallback } from 'react';

// Направление/высота поповеров сетки.
// ВАЖНО (песочница): front-компонент в Web Worker (Remote DOM) — НЕТ доступа
// к host DOM: getBoundingClientRect/window.innerHeight недоступны (краш
// "getBoundingClientRect is not a function"). Поэтому без DOM-замеров:
// дропдаун открывается вниз с фикс. max-высотой. SSOT для всех дропдаунов.
// См. docs/design/UI_PLAYBOOK.md §2.1 + research/twenty-sdk/fresh/layout/front-components.md.

export const useDropdownDirection = (maxHeight = 260) => {
  // measure сохраняем как no-op для совместимости вызовов (ref-callback).
  const measure = useCallback((_el: HTMLElement | null) => {}, []);
  return { dropUp: false, maxH: maxHeight, measure };
};
