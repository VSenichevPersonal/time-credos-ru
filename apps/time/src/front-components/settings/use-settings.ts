import { useCallback, useEffect, useState } from 'react';

import {
  fetchDeptSettings,
  fetchGlobalSettings,
  fetchHeadcounts,
  patchDept,
  patchGlobalSettings,
  type DeptPatch,
  type GlobalPatch,
} from 'src/front-components/settings/settings-rest';
import type {
  DeptSettings,
  GlobalSettings,
  Headcounts,
} from 'src/front-components/settings/types';

type State = {
  loading: boolean;
  error: string | null;
  global: GlobalSettings | null; // глобальный singleton credosTimeSettings
  depts: DeptSettings[];
  headcounts: Headcounts; // вычисляемая численность: deptId → активных сотрудников
  saving: boolean;
};

// Загрузка настроек отделов + оптимистичная inline-правка с PATCH.
export const useSettings = () => {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    global: null,
    depts: [],
    headcounts: {},
    saving: false,
  });

  useEffect(() => {
    let alive = true;
    Promise.all([fetchGlobalSettings(), fetchDeptSettings(), fetchHeadcounts()])
      .then(([global, depts, headcounts]) => {
        if (alive) {
          setState({ loading: false, error: null, global, depts, headcounts, saving: false });
        }
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

  // Оптимистично обновить глобальный singleton + PATCH. При ошибке — откат к
  // предыдущему значению (сохраняем prev до мутации).
  const updateGlobal = useCallback((patch: GlobalPatch) => {
    setState((s) => {
      if (!s.global) return s;
      const prev = s.global;
      const id = prev.id;
      patchGlobalSettings(id, patch)
        .then(() => setState((cur) => ({ ...cur, saving: false })))
        .catch((e: unknown) =>
          setState((cur) => ({
            ...cur,
            saving: false,
            global: cur.global?.id === id ? prev : cur.global,
            error: e instanceof Error ? e.message : 'Ошибка сохранения',
          })),
        );
      return { ...s, saving: true, error: null, global: { ...prev, ...patch } };
    });
  }, []);

  return { ...state, update, updateGlobal };
};
