import { useCallback, useEffect, useState } from 'react';

import { fetchTimesheetGrid } from 'src/front-components/reports/timesheet-grid/timesheet-grid-rest';
import type { T13Grid } from 'src/front-components/reports/timesheet-grid/types';

// Состояние табеля Т-13: месяц-период (нав ‹/›), тоггл буквенных кодов, загрузка.
// Период — календарный месяц (форма Т-13 помесячная). Песочница-safe (REST).

const pad = (n: number): string => String(n).padStart(2, '0');
const monthRange = (y: number, m: number): { from: string; to: string; label: string } => {
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(last)}`, label: `${MONTHS[m]} ${y}` };
};

const EMPTY: T13Grid = { ok: false, period: { from: '', to: '' }, dates: [], withCodes: false, rows: [] };

export const useTimesheetGrid = () => {
  const now = new Date();
  const [ym, setYm] = useState<{ y: number; m: number }>({ y: now.getUTCFullYear(), m: now.getUTCMonth() });
  const [withCodes, setWithCodes] = useState(false);
  const [data, setData] = useState<T13Grid>(EMPTY);
  const [loading, setLoading] = useState(true);

  const { from, to, label } = monthRange(ym.y, ym.m);

  const load = useCallback(() => {
    setLoading(true);
    void fetchTimesheetGrid(from, to, { withCodes }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [from, to, withCodes]);

  useEffect(load, [load]);

  const prev = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  return { data, loading, label, from, to, withCodes, setWithCodes, prev, next, reload: load };
};
