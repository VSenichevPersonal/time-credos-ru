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

// CISO-006 (P2): REST filter injection — client params интерполируются в filter-строки
// без валидации; запятая в значении = инъекция AND-условия. Детали:
// docs/security/findings/CISO-006-filter-injection.md.
describe('REST filter injection (CISO-006)', () => {
  it.todo('employeeId/from/to валидируются (UUID_RE / DATE_RE) до интерполяции в filter');
  it.todo('runSubmit: employeeId="VICTIM,status[neq]:DRAFT" отвергается, не обходит status[eq]:DRAFT');
  it.todo('workspaceMemberRef с запятой/доп-условием отвергается (усиление CISO-005)');
  it.todo('params.ids: каждый id матчит UUID_RE перед filter id[eq]:${id}');
});
