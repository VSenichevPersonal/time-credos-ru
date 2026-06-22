import { vi } from 'vitest';

// Security-guard для ролей: регрессионная защита от случайного включения
// hard-delete и нарушений CISO-002 least-privilege.
// [bug]#1 fix: canSoftDeleteAllObjectRecords=true в default-role.

vi.mock('twenty-sdk/define', () => ({
  defineApplicationRole: (cfg: Record<string, unknown>) => cfg,
  defineRole: (cfg: Record<string, unknown>) => cfg,
}));

import { describe, expect, it } from 'vitest';

// eslint-disable-next-line import/order
import defaultRole from 'src/default-role';
// eslint-disable-next-line import/order
import managerRole from 'src/roles/manager.role';
// eslint-disable-next-line import/order
import { CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const role = defaultRole as unknown as Record<string, unknown>;
type ObjPerm = {
  objectUniversalIdentifier: string;
  canReadObjectRecords: boolean;
  canUpdateObjectRecords: boolean;
  canSoftDeleteObjectRecords: boolean;
  canDestroyObjectRecords: boolean;
};

describe('default-role — security invariants (CISO-002 / [bug]#1)', () => {
  it('canDestroyAllObjectRecords = false (хард-удаление запрещено)', () => {
    expect(role.canDestroyAllObjectRecords).toBe(false);
  });

  it('canSoftDeleteAllObjectRecords = true (soft-delete разрешён для op:delete)', () => {
    expect(role.canSoftDeleteAllObjectRecords).toBe(true);
  });

  it('canReadAllObjectRecords = true (чтение данных разрешено)', () => {
    expect(role.canReadAllObjectRecords).toBe(true);
  });

  it('canUpdateAllObjectRecords = true (запись данных разрешена)', () => {
    expect(role.canUpdateAllObjectRecords).toBe(true);
  });

  it('objectPermissions содержит 9 объектов (8 time + 1 каталог, ADR-0010)', () => {
    const perms = role.objectPermissions as ObjPerm[];
    expect(perms).toHaveLength(9);
  });

  // [bug]#1 (UC-TS-07): destroy разрешён ТОЛЬКО на credosTimeEntries (REST DELETE =
  // hard-delete под app-токеном → 400 без destroy). Least-privilege: один объект,
  // app-токен только через /s/time-entry (CISO-011 гард APPROVED), user-роль destroy:false
  // (canDestroyAllObjectRecords=false выше). Никакой другой объект destroy не получает.
  it('canDestroyObjectRecords = true ТОЛЬКО на credosTimeEntries (scoped op:delete)', () => {
    const perms = role.objectPermissions as ObjPerm[];
    const destroyEnabled = perms.filter((p) => p.canDestroyObjectRecords === true);
    expect(destroyEnabled).toHaveLength(1);
    expect(destroyEnabled[0].objectUniversalIdentifier).toBe(
      CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('ВСЕ объекты имеют canSoftDeleteObjectRecords = true', () => {
    const perms = role.objectPermissions as ObjPerm[];
    const noSoftDelete = perms.filter((p) => !p.canSoftDeleteObjectRecords);
    expect(noSoftDelete).toHaveLength(0);
  });

  it('ВСЕ объекты имеют canReadObjectRecords = true', () => {
    const perms = role.objectPermissions as ObjPerm[];
    expect(perms.every((p) => p.canReadObjectRecords)).toBe(true);
  });

  it('ВСЕ объекты имеют canUpdateObjectRecords = true', () => {
    const perms = role.objectPermissions as ObjPerm[];
    expect(perms.every((p) => p.canUpdateObjectRecords)).toBe(true);
  });

  it('все objectUniversalIdentifier уникальны (нет дублей)', () => {
    const perms = role.objectPermissions as ObjPerm[];
    const ids = perms.map((p) => p.objectUniversalIdentifier);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── manager.role.ts ─────────────────────────────────────────────────────────

describe('manager-role — security invariants (CISO-002)', () => {
  const mgr = managerRole as unknown as Record<string, unknown>;
  type ObjPerm = {
    objectUniversalIdentifier: string;
    canReadObjectRecords: boolean;
    canUpdateObjectRecords: boolean;
    canSoftDeleteObjectRecords: boolean;
    canDestroyObjectRecords: boolean;
  };

  it('canDestroyAllObjectRecords = false (глобальный хард-удалит запрещён)', () => {
    expect(mgr.canDestroyAllObjectRecords).toBe(false);
  });

  it('canBeAssignedToUsers = true (роль назначается людям)', () => {
    expect(mgr.canBeAssignedToUsers).toBe(true);
  });

  it('canBeAssignedToApiKeys = false (роль не для токенов)', () => {
    expect(mgr.canBeAssignedToApiKeys).toBe(false);
  });

  it('objectPermissions содержит 7 объектов (без WorkdayCalendar)', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    expect(perms).toHaveLength(7);
  });

  it('НИ ОДИН объект не имеет canDestroyObjectRecords = true', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    expect(perms.filter((p) => p.canDestroyObjectRecords)).toHaveLength(0);
  });

  it('ВСЕ объекты имеют canReadObjectRecords = true', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    expect(perms.every((p) => p.canReadObjectRecords)).toBe(true);
  });

  it('ВСЕ объекты имеют canUpdateObjectRecords = true', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    expect(perms.every((p) => p.canUpdateObjectRecords)).toBe(true);
  });

  it('ВСЕ объекты имеют canSoftDeleteObjectRecords = true', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    expect(perms.every((p) => p.canSoftDeleteObjectRecords)).toBe(true);
  });

  it('все objectUniversalIdentifier уникальны', () => {
    const perms = mgr.objectPermissions as ObjPerm[];
    const ids = perms.map((p) => p.objectUniversalIdentifier);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
