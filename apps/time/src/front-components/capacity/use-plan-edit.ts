import { useCallback, useState } from 'react';

import {
  patchDeptPlan,
  patchProject,
  type ProjectPatch,
} from 'src/front-components/capacity/capacity-rest';
import { useSaveStatus, type SaveStatus } from 'src/front-components/grid/use-save-status';

// Сохранение плана руководителем: PATCH → рефетч (пересчёт загрузки на лету).
// `save` — план проекта (credosTimeProject); `saveDeptPlan` — план без проекта
// (credosTimeDeptPlan, REQ-0012). Статус — общий индикатор; ошибки REST не роняют
// доску, пишутся в error.
export const usePlanEdit = (
  reloadProjects: () => Promise<void>,
  reloadDeptPlans: () => Promise<void>,
) => {
  const { status, track } = useSaveStatus();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (op: () => Promise<void>): Promise<boolean> => {
      setError(null);
      try {
        await track(op);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить план');
        return false;
      }
    },
    [track],
  );

  const save = useCallback(
    (projectId: string, patch: ProjectPatch) =>
      run(async () => {
        await patchProject(projectId, patch);
        await reloadProjects();
      }),
    [run, reloadProjects],
  );

  const saveDeptPlan = useCallback(
    (planId: string, patch: ProjectPatch) =>
      run(async () => {
        await patchDeptPlan(planId, patch);
        await reloadDeptPlans();
      }),
    [run, reloadDeptPlans],
  );

  return { save, saveDeptPlan, status, error };
};

export type { SaveStatus };
