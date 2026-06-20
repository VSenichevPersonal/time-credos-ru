// Типы ответа /s/reports mode=timeseries (контракт REPORTS_CONTRACT.md §timeseries).
// Помесячная динамика факт/норма/утилизация/недогруз за период (тренд C4).

// Точка тренда — один месяц периода.
export type TimeseriesPoint = {
  month: string; // 'YYYY-MM' (бакет месяца)
  fact: number; // Σ часов записей месяца
  client: number; // Σ клиентских часов месяца (категория CLIENT)
  norm: number; // нормо-часы месяца
  util: number | null; // client / fact, null если fact == 0
  under: number; // norm − fact (>0 недогруз, <0 перегруз)
};

// Полный ответ режима тренда.
export type TimeseriesResponse = {
  ok: boolean;
  period: { from: string; to: string };
  departmentId: string | null; // эхо применённого фильтра отдела
  months: TimeseriesPoint[]; // отсортированы по возрастанию 'YYYY-MM'
  error?: string;
};
