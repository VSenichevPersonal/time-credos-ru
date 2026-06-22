import { describe, expect, it, vi } from 'vitest';

import type { Actor } from './resolve-actor';
import { canWriteFor, isActorProjectManager, type CanWriteForDeps } from './can-write-for';

const A = '11111111-1111-4111-8111-111111111111'; // actor employeeId
const T = '22222222-2222-4222-8222-222222222222'; // target employeeId
const P = '33333333-3333-4333-8333-333333333333'; // projectId

const actor = (over: Partial<NonNullable<Actor>> = {}): Actor => ({
  employeeId: A,
  isManager: false,
  trusted: true,
  ...over,
});

// Deps по умолчанию «всё запрещено» — каждый тест переопределяет нужную ветку.
const denyDeps: CanWriteForDeps = {
  isHeadOfEmployeeDept: vi.fn().mockResolvedValue(false),
  isProjectManager: vi.fn().mockResolvedValue(false),
};

describe('canWriteFor (ON-BEHALF server-gate)', () => {
  it('свой ввод: actor == target → true (без сетевых проверок)', async () => {
    const deps = { ...denyDeps };
    const ok = await canWriteFor(actor(), A, {}, deps);
    expect(ok).toBe(true);
    expect(deps.isHeadOfEmployeeDept).not.toHaveBeenCalled();
  });

  it('target пуст → true (трактуется как свой ввод вызывающим)', async () => {
    expect(await canWriteFor(actor(), null, {}, denyDeps)).toBe(true);
  });

  it('руководитель отдела target → true', async () => {
    const deps: CanWriteForDeps = {
      isHeadOfEmployeeDept: vi.fn().mockResolvedValue(true),
      isProjectManager: vi.fn().mockResolvedValue(false),
    };
    expect(await canWriteFor(actor(), T, {}, deps)).toBe(true);
    expect(deps.isHeadOfEmployeeDept).toHaveBeenCalledWith(A, T);
  });

  it('чужой actor (не head, не PM, не admin) → false (FORBIDDEN)', async () => {
    expect(await canWriteFor(actor(), T, { projectId: P }, denyDeps)).toBe(false);
  });

  it('PM проекта записи → true (мост WM→employee через projectId)', async () => {
    const deps: CanWriteForDeps = {
      isHeadOfEmployeeDept: vi.fn().mockResolvedValue(false),
      isProjectManager: vi.fn().mockResolvedValue(true),
    };
    expect(await canWriteFor(actor(), T, { projectId: P }, deps)).toBe(true);
    expect(deps.isProjectManager).toHaveBeenCalledWith(A, P);
  });

  it('PM-ветка пропускается без projectId в ctx', async () => {
    const deps: CanWriteForDeps = {
      isHeadOfEmployeeDept: vi.fn().mockResolvedValue(false),
      isProjectManager: vi.fn().mockResolvedValue(true),
    };
    expect(await canWriteFor(actor(), T, {}, deps)).toBe(false);
    expect(deps.isProjectManager).not.toHaveBeenCalled();
  });

  it('admin-деградация: isManager=true → true за любого (нет admin-роли, RBAC follow-up)', async () => {
    // Даже когда scope/PM не совпали — руководитель проходит глобально.
    expect(await canWriteFor(actor({ isManager: true }), T, { projectId: P }, denyDeps)).toBe(true);
  });

  it('деградация identity: actor=null → false (вызывающий не применяет gate)', async () => {
    expect(await canWriteFor(null, T, { projectId: P }, denyDeps)).toBe(false);
  });
});

describe('isActorProjectManager', () => {
  it('actor=null → false', async () => {
    expect(await isActorProjectManager(null, P, denyDeps)).toBe(false);
  });
  it('projectId пуст → false', async () => {
    expect(await isActorProjectManager(actor(), null, denyDeps)).toBe(false);
  });
  it('PM проекта → true', async () => {
    const deps: CanWriteForDeps = {
      isHeadOfEmployeeDept: vi.fn().mockResolvedValue(false),
      isProjectManager: vi.fn().mockResolvedValue(true),
    };
    expect(await isActorProjectManager(actor(), P, deps)).toBe(true);
    expect(deps.isProjectManager).toHaveBeenCalledWith(A, P);
  });
});
