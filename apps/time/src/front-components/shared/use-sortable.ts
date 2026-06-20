import { useState } from 'react';

// DP-0004: сортировка таблиц по клику заголовка. Состояние ключ+направление,
// сортировка in-memory (строки уже на клиенте). DOM-free, переиспользуемо
// (reports/grid). Клик по активной колонке — переключает asc/desc.

export type SortDir = 'asc' | 'desc';

export const useSortable = <K extends string>(defaultKey: K | null = null, defaultDir: SortDir = 'desc') => {
  const [key, setKey] = useState<K | null>(defaultKey);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  const toggle = (k: K) => {
    if (key === k) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setKey(k);
      setDir('desc');
    }
  };

  // Сортировка по геттеру значения. Строки сравниваем локалью (ru), числа — вычитанием.
  const sort = <T>(rows: T[], value: (r: T) => number | string): T[] => {
    if (!key) return rows;
    return [...rows].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const cmp =
        typeof va === 'string' && typeof vb === 'string'
          ? va.localeCompare(vb, 'ru')
          : Number(va) - Number(vb);
      return dir === 'asc' ? cmp : -cmp;
    });
  };

  return { key, dir, toggle, sort };
};
