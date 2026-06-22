import { describe, expect, it } from 'vitest';

import { calcApprovalByProject, calcPeriodStatus, periodAuditActor } from './use-approval';
import type { ApiEntry, DepartmentRef, ProjectRef } from './types';

// ─── фикстуры ─────────────────────────────────────────────────────────────────

const proj = (id: string, approvalRequired: boolean | null, departmentId = 'd1'): ProjectRef => ({
  id,
  code: null,
  name: id,
  rawName: id,
  client: null,
  departmentId,
  category: null,
  approvalRequired,
});

const dept = (id: string, approvalRequired: boolean | null): DepartmentRef => ({
  id,
  name: id,
  approvalRequired,
});

const entry = (id: string, projectId: string | null, status?: string | null): ApiEntry => ({
  id,
  date: '2026-01-12',
  hours: 8,
  description: null,
  projectId,
  workTypeId: null,
  status,
});

// ─── calcApprovalByProject ────────────────────────────────────────────────────

describe('calcApprovalByProject — резолв флага согласования', () => {
  it('проект true → true (флаг проекта перекрывает отдел)', () => {
    const m = calcApprovalByProject([proj('p1', true)], [dept('d1', false)]);
    expect(m.get('p1')).toBe(true);
  });

  it('проект false → false (флаг проекта перекрывает отдел)', () => {
    const m = calcApprovalByProject([proj('p1', false)], [dept('d1', true)]);
    expect(m.get('p1')).toBe(false);
  });

  it('проект null → наследует отдел (true)', () => {
    const m = calcApprovalByProject([proj('p1', null)], [dept('d1', true)]);
    expect(m.get('p1')).toBe(true);
  });

  it('проект null → наследует отдел (false)', () => {
    const m = calcApprovalByProject([proj('p1', null)], [dept('d1', false)]);
    expect(m.get('p1')).toBe(false);
  });

  it('проект null, отдел null → false (по умолчанию выкл)', () => {
    const m = calcApprovalByProject([proj('p1', null)], [dept('d1', null)]);
    expect(m.get('p1')).toBe(false);
  });

  it('проект без отдела (departmentId=null) → false при null флаге', () => {
    const m = calcApprovalByProject([proj('p1', null, null as unknown as string)], []);
    expect(m.get('p1')).toBe(false);
  });

  it('несколько проектов в разных отделах', () => {
    const m = calcApprovalByProject(
      [proj('p1', null, 'd1'), proj('p2', null, 'd2'), proj('p3', true, 'd2')],
      [dept('d1', false), dept('d2', true)],
    );
    expect(m.get('p1')).toBe(false);
    expect(m.get('p2')).toBe(true);
    expect(m.get('p3')).toBe(true);
  });

  it('проект из неизвестного отдела → false (отдела нет в списке)', () => {
    const m = calcApprovalByProject([proj('p1', null, 'unknown')], [dept('d1', true)]);
    expect(m.get('p1')).toBe(false);
  });
});

// ─── calcPeriodStatus ─────────────────────────────────────────────────────────

describe('calcPeriodStatus — агрегированный статус периода', () => {
  it('нет записей → none', () => {
    expect(calcPeriodStatus([])).toBe('none');
  });

  it('все DRAFT → DRAFT', () => {
    expect(calcPeriodStatus([
      entry('e1', 'p1', 'DRAFT'),
      entry('e2', 'p1', 'DRAFT'),
    ])).toBe('DRAFT');
  });

  it('status=null → DRAFT (по умолчанию)', () => {
    expect(calcPeriodStatus([entry('e1', 'p1', null)])).toBe('DRAFT');
  });

  it('status=undefined → DRAFT (поле отсутствует)', () => {
    expect(calcPeriodStatus([entry('e1', 'p1', undefined)])).toBe('DRAFT');
  });

  it('есть SUBMITTED (и DRAFT) → SUBMITTED', () => {
    expect(calcPeriodStatus([
      entry('e1', 'p1', 'DRAFT'),
      entry('e2', 'p1', 'SUBMITTED'),
    ])).toBe('SUBMITTED');
  });

  it('все APPROVED → APPROVED', () => {
    expect(calcPeriodStatus([
      entry('e1', 'p1', 'APPROVED'),
      entry('e2', 'p1', 'APPROVED'),
    ])).toBe('APPROVED');
  });

  it('есть REJECTED (приоритет выше SUBMITTED) → REJECTED', () => {
    expect(calcPeriodStatus([
      entry('e1', 'p1', 'SUBMITTED'),
      entry('e2', 'p1', 'REJECTED'),
    ])).toBe('REJECTED');
  });

  it('REJECTED приоритетнее APPROVED', () => {
    expect(calcPeriodStatus([
      entry('e1', 'p1', 'APPROVED'),
      entry('e2', 'p1', 'REJECTED'),
    ])).toBe('REJECTED');
  });

  it('одна запись SUBMITTED → SUBMITTED', () => {
    expect(calcPeriodStatus([entry('e1', 'p1', 'SUBMITTED')])).toBe('SUBMITTED');
  });
});

// ─── periodAuditActor (WI-56 «кто отклонил/отозвал») ────────────────────────────

const withAudit = (
  id: string,
  status: string,
  audit: { resolvedBy?: string | null; revokedBy?: string | null },
): ApiEntry => ({ ...entry(id, 'p1', status), ...audit });

describe('periodAuditActor — подпись аудита периода', () => {
  it('REJECTED → kind=rejected + resolvedBy', () => {
    const a = periodAuditActor([withAudit('e1', 'REJECTED', { resolvedBy: 'uw-7' })], 'REJECTED');
    expect(a).toEqual({ kind: 'rejected', actorId: 'uw-7' });
  });

  it('REJECTED без resolvedBy → null', () => {
    expect(periodAuditActor([withAudit('e1', 'REJECTED', {})], 'REJECTED')).toBeNull();
  });

  it('SUBMITTED c revokedBy → kind=revoked (отзыв согласования)', () => {
    const a = periodAuditActor([withAudit('e1', 'SUBMITTED', { revokedBy: 'uw-9' })], 'SUBMITTED');
    expect(a).toEqual({ kind: 'revoked', actorId: 'uw-9' });
  });

  it('SUBMITTED без revokedBy → null (обычная отправка)', () => {
    expect(periodAuditActor([withAudit('e1', 'SUBMITTED', {})], 'SUBMITTED')).toBeNull();
  });

  it('APPROVED → null (нет аудит-подписи в полосе)', () => {
    expect(periodAuditActor([withAudit('e1', 'APPROVED', { resolvedBy: 'uw-1' })], 'APPROVED')).toBeNull();
  });

  it('REJECTED: берёт первую отклонённую запись с актором', () => {
    const a = periodAuditActor(
      [
        withAudit('e1', 'SUBMITTED', { revokedBy: 'uw-x' }),
        withAudit('e2', 'REJECTED', { resolvedBy: 'uw-2' }),
      ],
      'REJECTED',
    );
    expect(a).toEqual({ kind: 'rejected', actorId: 'uw-2' });
  });
});
