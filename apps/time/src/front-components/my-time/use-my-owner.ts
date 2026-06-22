import { useEffect, useState } from 'react';

import { fetchDepartments, fetchEmployees } from 'src/front-components/grid/time-rest';
import {
  buildTimesheetOwner,
  type TimesheetOwner,
} from 'src/front-components/grid/whose-timesheet';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';

// «Чей таймшит» для личного кабинета (REQ on-behalf #1, read-only): свой ФИО · отдел
// над разделом «Мои трудозатраты». Тот же чистый buildTimesheetOwner + reveal
// (CISO-007), что в сетке. Грузит справочники сотрудников/отделов один раз на смену
// employeeId. Песочница-safe (только REST). employeeId=null → owner=null.

export const useMyOwner = (employeeId: string | null): TimesheetOwner | null => {
  const settings = useGlobalSettings();
  const reveal = settings?.revealEmployeeNames === true;
  const [owner, setOwner] = useState<TimesheetOwner | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setOwner(null);
      return;
    }
    let alive = true;
    void Promise.all([fetchEmployees(), fetchDepartments()])
      .then(([employees, departments]) => {
        if (alive)
          setOwner(buildTimesheetOwner(employeeId, employees, departments, reveal));
      })
      .catch(() => {
        if (alive) setOwner(null); // справочник не загрузился — индикатор не рисуем
      });
    return () => {
      alive = false;
    };
  }, [employeeId, reveal]);

  return owner;
};
