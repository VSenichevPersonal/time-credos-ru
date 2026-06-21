import { useCallback, useState } from 'react';

import { fetchDetailCsv, type CsvExport, type DetailFilters } from 'src/front-components/reports/reports-rest';

// F-F (REQ-0006): состояние экспорта detail-CSV. Тянет CSV из /s/reports
// (groupBy=detail, format=csv) и держит результат для показа/копирования.
// ОГРАНИЧЕНИЕ ПЕСОЧНИЦЫ: front-component работает в Remote DOM — нет host-DOM
// (document/Blob/URL.createObjectURL/anchor.download недоступны), поэтому
// АВТОСКАЧИВАНИЕ файла из песочницы НЕВОЗМОЖНО. CSV отдаётся пользователю для
// ручного копирования (выделяемый блок). Прямое скачивание — follow-up: нужен
// host-bridge (twenty action «download»/«copyToClipboard»), которого в SDK сейчас
// нет. Контракт бэка готов — как только мост появится, добавить вызов здесь.

export type CsvExportState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  result: CsvExport | null;
  error: string | null;
};

export const useCsvExport = (
  from: string,
  to: string,
  filters: DetailFilters = {},
) => {
  const [state, setState] = useState<CsvExportState>({
    status: 'idle',
    result: null,
    error: null,
  });

  // Стабилизируем фильтры строкой — объект-литерал из родителя меняет ссылку.
  const filtersKey = `${filters.deptId ?? ''}|${filters.projectId ?? ''}|${filters.employeeId ?? ''}`;

  const run = useCallback(async () => {
    setState({ status: 'loading', result: null, error: null });
    const res = await fetchDetailCsv(from, to, filters);
    if (!res.ok) {
      setState({ status: 'error', result: null, error: res.error ?? 'Не удалось выгрузить CSV' });
      return;
    }
    setState({ status: 'ready', result: res, error: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, filtersKey]);

  const close = useCallback(() => setState({ status: 'idle', result: null, error: null }), []);

  return { ...state, run, close };
};
