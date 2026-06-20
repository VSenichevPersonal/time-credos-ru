import { describe, it } from 'vitest';

// Security-регресс-спека для CISO-005 (broken access control / IDOR / impersonation)
// и связанного CISO-002 (separation of duties в approval).
// Детали: docs/security/findings/CISO-005-time-entry-idor.md.
//
// Сейчас identity берётся из client-supplied `params.workspaceMemberRef`, а не из
// аутентифицированного `event.userWorkspaceId` → любой юзер может действовать от
// чужого имени. Тесты — `it.todo`: НЕ падают, фиксируют контракт, который QA
// проверит, как только Dev 2 введёт server-side резолв userWorkspace→employee
// (корень фикса). Тогда `todo` → реальные тесты с мок-`fetch`.
describe('time-entry-api: ownership / anti-impersonation (CISO-005)', () => {
  it.todo('identity сотрудника берётся из event.userWorkspaceId, НЕ из params.workspaceMemberRef');
  it.todo('op=upsert create: employeeId = резолв актора, нельзя создать запись от чужого имени');
  it.todo('op=upsert patch: нельзя править чужую запись по id (ownership-guard)');
  it.todo('op=delete: нельзя удалить чужую запись (ownership-guard), кроме роли «Руководитель»');
  it.todo('op=list: возвращает только записи актора (или скоуп по роли), не любого employeeId');
  it.todo('DEV-fallback «первый активный» отсутствует в прод-пути (TODO(prod) L93)');
});

describe('approval: separation of duties (CISO-002)', () => {
  it.todo('runResolve: актор не может approve/reject СВОИ записи (actor != owner)');
  it.todo('runResolve: approve/reject доступны только роли «Руководитель» (canApprove)');
});
