import { useCallback, useState } from 'react';

import { patchProject, type ProjectPatch } from 'src/front-components/capacity/capacity-rest';
import { useSaveStatus, type SaveStatus } from 'src/front-components/grid/use-save-status';

// Сохранение плана проекта руководителем: PATCH credosTimeProject → рефетч
// проектов (пересчёт загрузки на лету). Статус — общий индикатор «сохранение/
// сохранено/ошибка»; ошибки REST не роняют доску, а пишутся в error.
export const usePlanEdit = (reloadProjects: () => Promise<void>) => {
  const { status, track } = useSaveStatus();
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (projectId: string, patch: ProjectPatch): Promise<boolean> => {
      setError(null);
      try {
        await track(async () => {
          await patchProject(projectId, patch);
          await reloadProjects();
        });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить план');
        return false;
      }
    },
    [reloadProjects, track],
  );

  return { save, status, error };
};

export type { SaveStatus };
