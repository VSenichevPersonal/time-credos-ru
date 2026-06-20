import { useMemo, useState } from 'react';

// Период дашборда: гранулярность (месяц/квартал/год) + смещение от текущего.
// Без host-DOM — чистый расчёт дат (UTC).

export type PeriodGran = 'month' | 'quarter' | 'year';

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

export type PeriodState = {
  gran: PeriodGran;
  from: string; // ISO datetime (вкл.)
  to: string; // ISO datetime (вкл.)
  label: string;
};

// Границы периода по гранулярности и смещению (offset: 0 = текущий, −1 = предыдущий).
const computeRange = (gran: PeriodGran, offset: number, now: Date): PeriodState => {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  let from: Date;
  let to: Date;
  let label: string;
  if (gran === 'month') {
    from = new Date(Date.UTC(y, m + offset, 1));
    to = new Date(Date.UTC(y, m + offset + 1, 0, 23, 59, 59, 999));
    label = `${MONTHS[from.getUTCMonth()]} ${from.getUTCFullYear()}`;
  } else if (gran === 'quarter') {
    const q = Math.floor(m / 3) + offset;
    from = new Date(Date.UTC(y, q * 3, 1));
    to = new Date(Date.UTC(y, q * 3 + 3, 0, 23, 59, 59, 999));
    label = `${from.getUTCFullYear()} · ${Math.floor(from.getUTCMonth() / 3) + 1} кв.`;
  } else {
    from = new Date(Date.UTC(y + offset, 0, 1));
    to = new Date(Date.UTC(y + offset, 11, 31, 23, 59, 59, 999));
    label = `${from.getUTCFullYear()} год`;
  }
  return {
    gran,
    from: from.toISOString(),
    to: to.toISOString(),
    label,
  };
};

export const usePeriod = () => {
  const now = useMemo(() => new Date(), []);
  const [gran, setGran] = useState<PeriodGran>('month');
  const [offset, setOffset] = useState(0);

  const period = useMemo(() => computeRange(gran, offset, now), [gran, offset, now]);

  const changeGran = (g: PeriodGran) => {
    setGran(g);
    setOffset(0); // смена гранулярности сбрасывает на текущий
  };

  return {
    period,
    gran,
    isCurrent: offset === 0,
    prev: () => setOffset((o) => o - 1),
    next: () => setOffset((o) => Math.min(0, o + 1)), // не уходим в будущее
    setGran: changeGran,
  };
};
