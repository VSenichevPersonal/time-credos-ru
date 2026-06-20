import { useCallback, useEffect, useState } from 'react';

import {
  fetchDeptSettings,
  patchDept,
  type DeptPatch,
} from 'src/front-components/settings/settings-rest';
import type { DeptSettings } from 'src/front-components/settings/types';

type State = {
  loading: boolean;
  error: string | null;
  depts: DeptSettings[];
  saving: boolean;
};

// Загрузка настроек отделов + оптимистичная inline-правка с PATCH.
export const useSettings = () => {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    depts: [],
    saving: false,
  });

  useEffect(() => {
    let alive = true;
    fetchDeptSettings()
      .then((depts) => {
        if (alive) setState({ loading: false, error: null, depts, saving: false });
      })
      .catch((e: unknown) => {
        if (alive) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Ошибка загрузки',
          }));
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Оптимистично обновить поле отдела + PATCH. При ошибке — откат.
  const update = useCallback((id: string, patch: DeptPatch) => {
    setState((s) => ({
      ...s,
      saving: true,
      depts: s.depts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
    patchDept(id, patch)
      .then(() => setState((s) => ({ ...s, saving: false })))
      .catch((e: unknown) =>
        setState((s) => ({
          ...s,
          saving: false,
          error: e instanceof Error ? e.message : 'Ошибка сохранения',
        })),
      );
  }, []);

  return { ...state, update };
};
