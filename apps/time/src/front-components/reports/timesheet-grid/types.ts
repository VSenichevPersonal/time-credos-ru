// Табель Т-13 (REQ-0006 п.4): сетка сотрудник×день за месяц. Контракт сервера —
// /s/reports groupBy=timesheet-grid (logic-functions/reports-timesheet-grid.ts).

export type T13Cell = {
  hours: number;
  code: string | null; // буквенный код Т-13: 'Я'|'ОТ'|'Б'|'ДО'|'К'|'НН'|null
};

export type T13Row = {
  employeeKey: string; // employeeId — стабильный ключ строки
  employeeName: string; // ФИО при reveal, иначе КОД «Сотрудник·…» (CISO-007)
  deptName: string;
  cells: T13Cell[]; // длина = dates.length
  total: number; // Σ часов за период
};

export type T13Grid = {
  ok: boolean;
  period: { from: string; to: string };
  dates: string[]; // YYYY-MM-DD по колонкам
  withCodes: boolean;
  rows: T13Row[];
  error?: string;
};
