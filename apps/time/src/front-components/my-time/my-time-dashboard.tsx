import { useState } from 'react';

import { T, FONT } from 'src/front-components/grid/tokens';
import { Center } from 'src/front-components/grid/center';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { useSelfEmployee } from 'src/front-components/shared/use-self-employee';
import { MyHours } from 'src/front-components/my-time/my-hours';
import { MyPeriods } from 'src/front-components/my-time/my-periods';

// REQ-0014 «Мои трудозатраты»: личный кабинет ТЕКУЩЕГО юзера (резолв «мой» —
// useSelfEmployee.employeeId). Две вкладки: «Мои часы» (факт/норма/недогруз +
// разбивка) и «Мои периоды» (недели со статусами). Если профиль не связан с
// сотрудником (employeeId=null) — дружелюбное состояние, без краша. Каждая
// вкладка изолирована ErrorBoundary (краш одной не роняет раздел).

type Tab = 'hours' | 'periods';

// Профиль не привязан к сотруднику: рядовой UX-гейт (не ошибка), даём действие.
const Unlinked = () => (
  <Center>
    <span style={{ maxWidth: 380, lineHeight: 1.55 }}>
      <span style={{ display: 'block', fontWeight: 600, color: T.text, marginBottom: 6 }}>
        Профиль не связан с сотрудником
      </span>
      Чтобы видеть свои часы и периоды, попросите администратора привязать вашу
      учётную запись к карточке сотрудника в разделе «Сотрудники».
    </span>
  </Center>
);

export const MyTimeDashboard = () => {
  const { employeeId, loading } = useSelfEmployee();
  const [tab, setTab] = useState<Tab>('hours');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          background: T.panelBg,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>Мои трудозатраты</span>
        {employeeId && (
          <span style={{ marginLeft: 'auto' }}>
            <Segmented
              ariaLabel="Раздел"
              value={tab}
              segments={[
                { value: 'hours', label: 'Мои часы' },
                { value: 'periods', label: 'Мои периоды' },
              ]}
              onChange={(t: Tab) => setTab(t)}
            />
          </span>
        )}
      </div>

      {loading ? (
        <Center>Загрузка профиля…</Center>
      ) : !employeeId ? (
        <Unlinked />
      ) : tab === 'hours' ? (
        <ErrorBoundary title="Не удалось показать мои часы" resetKeys={[tab, employeeId]}>
          <MyHours employeeId={employeeId} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary title="Не удалось показать мои периоды" resetKeys={[tab, employeeId]}>
          <MyPeriods employeeId={employeeId} />
        </ErrorBoundary>
      )}
    </div>
  );
};
