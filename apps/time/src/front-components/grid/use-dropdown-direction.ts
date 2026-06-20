import { useCallback, useState } from 'react';

// Направление и макс. высота поповера по свободному месту вокруг якоря.
// У нижней кромки фикс-виджета (overflow:hidden, без портала к body) меню
// открывается ВВЕРХ, иначе обрежется. SSOT для всех дропдаунов сетки.
// См. docs/design/UI_PLAYBOOK.md §2.1.

export const useDropdownDirection = (maxHeight = 260) => {
  const [dropUp, setDropUp] = useState(false);
  const [maxH, setMaxH] = useState(maxHeight);

  // Замерять на каждом открытии: позиция якоря в виджете могла измениться.
  const measure = useCallback(
    (el: HTMLElement | null) => {
      const r = el?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 8;
      const above = r.top - 8;
      const up = below < 200 && above > below;
      setDropUp(up);
      setMaxH(Math.max(120, Math.min(maxHeight, up ? above : below)));
    },
    [maxHeight],
  );

  return { dropUp, maxH, measure };
};
