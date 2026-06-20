import { describe, expect, it } from 'vitest';

import { ENTRY_STATUS, isApprovalRequired } from 'src/constants/approval';

// Юнит-тесты SSOT-логики согласования. Правило: флаг проекта переопределяет
// отдел; null/undefined на проекте → наследует отдел; нет отдела → false.
describe('isApprovalRequired', () => {
  it('флаг проекта переопределяет отдел: true над false', () => {
    expect(isApprovalRequired(true, false)).toBe(true);
  });

  it('флаг проекта переопределяет отдел: false над true', () => {
    expect(isApprovalRequired(false, true)).toBe(false);
  });

  it('null на проекте наследует отдел', () => {
    expect(isApprovalRequired(null, true)).toBe(true);
    expect(isApprovalRequired(null, false)).toBe(false);
  });

  it('undefined на проекте наследует отдел', () => {
    expect(isApprovalRequired(undefined, true)).toBe(true);
    expect(isApprovalRequired(undefined, false)).toBe(false);
  });

  it('оба не заданы → false (по умолчанию согласование выключено)', () => {
    expect(isApprovalRequired(null, null)).toBe(false);
    expect(isApprovalRequired(undefined, undefined)).toBe(false);
    expect(isApprovalRequired(null, undefined)).toBe(false);
  });
});

describe('ENTRY_STATUS', () => {
  it('коды статусов в UPPER_CASE и совпадают с ключами (значения SELECT в БД)', () => {
    expect(ENTRY_STATUS).toEqual({
      DRAFT: 'DRAFT',
      SUBMITTED: 'SUBMITTED',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
    });
  });
});
