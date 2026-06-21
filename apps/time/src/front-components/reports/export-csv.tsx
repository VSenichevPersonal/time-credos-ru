import { T } from 'src/front-components/reports/report-tokens';
import { useCsvExport } from 'src/front-components/reports/use-csv-export';
import type { DetailFilters } from 'src/front-components/reports/reports-rest';

// F-F (REQ-0006): кнопка «Экспорт CSV» detail-отчёта + панель результата.
// Контракт Dev2: /s/reports {groupBy:'detail', format:'csv', from, to, ...} →
// {csv, mimeType, filename}. CSV готов с BOM + `;` (1С/RU-Excel).
//
// ПЕСОЧНИЦА: front-component = Remote DOM, host-DOM (Blob/URL/anchor.download)
// недоступен → файл НЕ скачивается автоматически. Поэтому показываем CSV в
// выделяемом блоке для ручного копирования (Ctrl/Cmd+A → Ctrl/Cmd+C → вставить в
// .csv / Excel). Прямое скачивание — follow-up (нужен host-bridge download).

type Props = {
  from: string;
  to: string;
  filters?: DetailFilters;
  disabled?: boolean;
};

const btnStyle = (disabled: boolean) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    fontSize: 12.5,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer',
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    color: disabled ? T.textFaint : T.text,
    background: T.surface,
  }) as const;

export const ExportCsvButton = ({ from, to, filters = {}, disabled }: Props) => {
  const { status, result, error, run, close } = useCsvExport(from, to, filters);
  const loading = status === 'loading';

  return (
    <>
      <button
        type="button"
        onClick={loading || disabled ? undefined : () => void run()}
        disabled={loading || disabled}
        title="Выгрузить детальные записи периода в CSV (1С/Excel, RU)"
        style={btnStyle(!!disabled || loading)}
      >
        <span aria-hidden style={{ fontSize: 12 }}>⤓</span>
        {loading ? 'Готовим CSV…' : 'Экспорт CSV'}
      </button>

      {status === 'error' && (
        <span role="alert" style={{ fontSize: 11.5, color: T.over }}>
          {error}
        </span>
      )}

      {status === 'ready' && result && (
        <div
          role="dialog"
          aria-label="Экспорт CSV"
          style={{
            position: 'absolute',
            top: 52,
            right: 14,
            zIndex: 10,
            width: 'min(560px, 90%)',
            maxHeight: '70%',
            display: 'flex',
            flexDirection: 'column',
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(20, 24, 33, 0.16)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              CSV готов
            </span>
            <span style={{ fontSize: 11.5, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.filename}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              style={{
                marginLeft: 'auto',
                width: 24,
                height: 24,
                border: 'none',
                background: 'transparent',
                color: T.textMuted,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 15,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '8px 12px', fontSize: 11.5, color: T.textMuted, lineHeight: 1.4 }}>
            Скачивание файла из встроенного виджета недоступно. Выделите содержимое
            (Cmd/Ctrl+A в блоке ниже), скопируйте и сохраните как
            <code style={{ margin: '0 4px', color: T.text }}>{result.filename}</code>
            или вставьте в Excel.
          </div>
          <div
            style={{
              flex: 1,
              margin: '0 12px 12px',
              padding: 8,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              background: T.panelBg,
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              lineHeight: 1.5,
              color: T.text,
              whiteSpace: 'pre',
              userSelect: 'text',
            }}
          >
            {result.csv}
          </div>
        </div>
      )}
    </>
  );
};
