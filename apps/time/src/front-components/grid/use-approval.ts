import { useCallback, useMemo, useState } from 'react';

import { ENTRY_STATUS, isApprovalRequired } from 'src/constants/approval';
import type { ApiEntry, DepartmentRef, ProjectRef } from 'src/front-components/grid/types';
import {
  recallEntries,
  resolveEntries,
  revokeEntries,
  submitEntries,
} from 'src/front-components/grid/approval-rest';

// Состояние согласования периода: требуется ли вообще, агрегированный статус,
// какие записи можно отправить/решить. Только записи проектов, где согласование
// включено (Project.approvalRequired ?? Department.approvalRequired).

// Агрегированный статус периода (приоритет: есть отклонённые > на согласовании >
// все согласованы > черновик). Используется для бейджа.
export type PeriodStatus = 'none' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

type Args = {
  entries: ApiEntry[];
  projects: ProjectRef[];
  departments: DepartmentRef[];
  employeeId: string | null;
  from: string;
  to: string;
  reload: () => Promise<void>;
};

// Чистая функция: карта projectId → требуется ли согласование.
export const calcApprovalByProject = (
  projects: ProjectRef[],
  departments: DepartmentRef[],
): Map<string, boolean> => {
  const deptApproval = new Map(departments.map((d) => [d.id, d.approvalRequired]));
  const map = new Map<string, boolean>();
  for (const p of projects) {
    const dept = p.departmentId ? deptApproval.get(p.departmentId) ?? null : null;
    map.set(p.id, isApprovalRequired(p.approvalRequired, dept));
  }
  return map;
};

// Чистая функция: агрегированный статус периода.
// Приоритет: REJECTED > SUBMITTED > APPROVED > DRAFT > none.
export const calcPeriodStatus = (tracked: ApiEntry[]): PeriodStatus => {
  if (tracked.length === 0) return 'none';
  if (tracked.some((e) => e.status === ENTRY_STATUS.REJECTED)) return 'REJECTED';
  if (tracked.some((e) => e.status === ENTRY_STATUS.SUBMITTED)) return 'SUBMITTED';
  if (tracked.every((e) => e.status === ENTRY_STATUS.APPROVED)) return 'APPROVED';
  return 'DRAFT';
};

// WI-56 подпись периода: какой актор-аудит показать в полосе согласования.
// REJECTED-период → «отклонил» (resolvedBy последней отклонённой записи).
// «Отозванный» период (нет approvedAt, есть revokedBy) → «отозвал». Чистая функция.
export type PeriodAudit = { kind: 'rejected' | 'revoked'; actorId: string } | null;

export const periodAuditActor = (tracked: ApiEntry[], status: PeriodStatus): PeriodAudit => {
  if (status === 'REJECTED') {
    const rej = tracked.find((e) => e.status === ENTRY_STATUS.REJECTED && e.resolvedBy);
    if (rej?.resolvedBy) return { kind: 'rejected', actorId: rej.resolvedBy };
  }
  // Отзыв согласования возвращает запись в SUBMITTED — показываем «отозвал»,
  // если такая запись несёт revokedBy (revoke руководителем). recall сотрудника
  // уводит в DRAFT (его подпись здесь не нужна — это собственное действие).
  if (status === 'SUBMITTED') {
    const rev = tracked.find((e) => e.status === ENTRY_STATUS.SUBMITTED && e.revokedBy);
    if (rev?.revokedBy) return { kind: 'revoked', actorId: rev.revokedBy };
  }
  return null;
};

export const useApproval = ({
  entries,
  projects,
  departments,
  employeeId,
  from,
  to,
  reload,
}: Args) => {
  const [busy, setBusy] = useState(false);

  const approvalByProject = useMemo(
    () => calcApprovalByProject(projects, departments),
    [projects, departments],
  );

  // Записи периода, по проектам которых требуется согласование.
  const tracked = useMemo(
    () => entries.filter((e) => e.projectId && approvalByProject.get(e.projectId)),
    [entries, approvalByProject],
  );

  // Согласование вообще применимо к этому периоду?
  const required = tracked.length > 0;

  const draftIds = useMemo(
    () => tracked.filter((e) => (e.status ?? ENTRY_STATUS.DRAFT) === ENTRY_STATUS.DRAFT).map((e) => e.id),
    [tracked],
  );
  const submittedIds = useMemo(
    () => tracked.filter((e) => e.status === ENTRY_STATUS.SUBMITTED).map((e) => e.id),
    [tracked],
  );

  const periodStatus: PeriodStatus = useMemo(() => calcPeriodStatus(tracked), [tracked]);

  const wrap = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      try {
        await fn();
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const submit = useCallback(() => {
    if (!employeeId || draftIds.length === 0) return;
    void wrap(() => submitEntries(from, to, employeeId, draftIds));
  }, [employeeId, draftIds, from, to, wrap]);

  const approve = useCallback(() => {
    if (submittedIds.length === 0) return;
    void wrap(() => resolveEntries(submittedIds, true));
  }, [submittedIds, wrap]);

  // reject — с обязательной причиной (Timetta: отклонение таймшита с комментарием).
  // comment прокидывается до /s/ роута → rejectComment (сотрудник видит причину).
  const reject = useCallback(
    (comment: string) => {
      if (submittedIds.length === 0) return;
      void wrap(() => resolveEntries(submittedIds, false, comment));
    },
    [submittedIds, wrap],
  );

  // WI-10 отзыв из сетки. recall — сотрудник отзывает СВОЮ отправку (SUBMITTED→DRAFT);
  // revoke — руководитель отзывает согласование (APPROVED→SUBMITTED). Принимают
  // явный набор id (вызов из 🔒-ячейки/меню строки). Серверный гард — в /s/approval.
  const recall = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      void wrap(() => recallEntries(ids));
    },
    [wrap],
  );
  const revoke = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      void wrap(() => revokeEntries(ids));
    },
    [wrap],
  );

  // WI-56 подпись «отклонил/отозвал» периода (actorId — userWorkspaceId, резолв в ФИО/КОД у потребителя).
  const audit = useMemo(() => periodAuditActor(tracked, periodStatus), [tracked, periodStatus]);

  return {
    required,
    periodStatus,
    canSubmit: draftIds.length > 0,
    canResolve: submittedIds.length > 0,
    draftCount: draftIds.length,
    submittedCount: submittedIds.length,
    busy,
    submit,
    approve,
    reject,
    recall,
    revoke,
    audit,
  };
};
