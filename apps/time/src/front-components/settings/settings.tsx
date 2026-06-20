import { navigate, AppPath } from 'twenty-sdk/front-component';

import { T, FONT } from 'src/front-components/grid/tokens';
import { Center } from 'src/front-components/grid/center';
import { DeptSection } from 'src/front-components/settings/dept-section';
import { useSettings } from 'src/front-components/settings/use-settings';

// Подраздел Settings → «Настройки Time Credos». v1: конфигурация отделов
// (согласование/коэффициент ёмкости/численность) + быстрые ссылки на справочники.

const REFERENCES: { label: string; plural: string }[] = [
  { label: 'Виды работ', plural: 'credosTimeWorkTypes' },
  { label: 'Производственный календарь', plural: 'credosTimeWorkdayCalendars' },
  { label: 'Сотрудники', plural: 'credosTimeEmployees' },
];

const SectionTitle = ({ children, hint }: { children: string; hint?: string }) => (
  <div style={{ margin: '20px 0 8px' }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{children}</div>
    {hint && <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2 }}>{hint}</div>}
  </div>
);

export const CredosSettings = () => {
  const { loading, error, depts, saving, update } = useSettings();

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        padding: '4px 2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Настройки Time Credos</span>
        <span style={{ fontSize: 11.5, color: saving ? T.accent : 'transparent' }}>
          Сохранение…
        </span>
      </div>

      <SectionTitle hint="Согласование трудозатрат, коэффициент ёмкости и численность для расчёта планирования.">
        Отделы
      </SectionTitle>

      {error ? (
        <Center>Не удалось загрузить настройки: {error}</Center>
      ) : loading ? (
        <Center>Загрузка настроек…</Center>
      ) : depts.length === 0 ? (
        <Center>Нет отделов</Center>
      ) : (
        <DeptSection depts={depts} onUpdate={update} />
      )}

      <SectionTitle hint="Справочники модуля управляются на отдельных страницах.">
        Справочники
      </SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {REFERENCES.map((r) => (
          <button
            key={r.plural}
            onClick={() => navigate(AppPath.RecordIndexPage, { objectNamePlural: r.plural })}
            style={{
              height: 30,
              padding: '0 12px',
              fontSize: 12.5,
              fontWeight: 500,
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              background: T.surface,
              color: T.accent,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {r.label} →
          </button>
        ))}
      </div>
    </div>
  );
};
