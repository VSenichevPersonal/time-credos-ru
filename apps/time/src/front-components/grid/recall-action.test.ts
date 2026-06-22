import { describe, expect, it } from 'vitest';

import { recallPlanForCell, recallPlanForRow } from './recall-action';

// WI-10: логика кнопки отзыва согласования из сетки.
// recall  = SUBMITTED → DRAFT   (владелец);
// revoke  = APPROVED  → SUBMITTED (только руководитель).

describe('recallPlanForCell', () => {
  it('entryId null → null (пустая ячейка)', () => {
    expect(recallPlanForCell(null, 'APPROVED', true)).toBeNull();
  });

  it('APPROVED + isManager=true → revoke без deniedReason', () => {
    const plan = recallPlanForCell('id-1', 'APPROVED', true);
    expect(plan).not.toBeNull();
    expect(plan!.mode).toBe('revoke');
    expect(plan!.ids).toEqual(['id-1']);
    expect(plan!.deniedReason).toBeNull();
  });

  it('APPROVED + isManager=false → revoke с deniedReason', () => {
    const plan = recallPlanForCell('id-1', 'APPROVED', false);
    expect(plan!.mode).toBe('revoke');
    expect(plan!.deniedReason).toMatch(/руководитель/i);
  });

  it('SUBMITTED → recall (владелец, без ограничений)', () => {
    const plan = recallPlanForCell('id-2', 'SUBMITTED', false);
    expect(plan!.mode).toBe('recall');
    expect(plan!.ids).toEqual(['id-2']);
    expect(plan!.deniedReason).toBeNull();
  });

  it('DRAFT → null (нечего отзывать)', () => {
    expect(recallPlanForCell('id-3', 'DRAFT', true)).toBeNull();
  });

  it('null-статус → null', () => {
    expect(recallPlanForCell('id-4', null, true)).toBeNull();
  });
});

describe('recallPlanForRow', () => {
  const row = (statuses: (string | null)[], ids?: (string | null)[]) => ({
    statusByDay: statuses,
    entryIdByDay: ids ?? statuses.map((s, i) => (s ? `id-${i}` : null)),
  });

  it('нет записей → null', () => {
    expect(recallPlanForRow(row([null, null, null]), true)).toBeNull();
  });

  it('только APPROVED + isManager → revoke без denied', () => {
    const plan = recallPlanForRow(row(['APPROVED', null, 'APPROVED']), true);
    expect(plan!.mode).toBe('revoke');
    expect(plan!.ids).toHaveLength(2);
    expect(plan!.deniedReason).toBeNull();
  });

  it('только APPROVED + !isManager → revoke с denied', () => {
    const plan = recallPlanForRow(row(['APPROVED', null]), false);
    expect(plan!.mode).toBe('revoke');
    expect(plan!.deniedReason).toMatch(/руководитель/i);
  });

  it('только SUBMITTED → recall', () => {
    const plan = recallPlanForRow(row(['SUBMITTED', 'SUBMITTED', null]), true);
    expect(plan!.mode).toBe('recall');
    expect(plan!.ids).toHaveLength(2);
    expect(plan!.deniedReason).toBeNull();
  });

  it('APPROVED приоритет над SUBMITTED (главный тупик → revoke)', () => {
    const plan = recallPlanForRow(row(['APPROVED', 'SUBMITTED']), true);
    expect(plan!.mode).toBe('revoke');
    expect(plan!.ids).toHaveLength(1); // только APPROVED
  });

  it('DRAFT не попадает в ids отзыва', () => {
    const plan = recallPlanForRow(row(['DRAFT', 'SUBMITTED']), true);
    expect(plan!.mode).toBe('recall');
    expect(plan!.ids.every((id) => id.includes('1'))).toBe(true); // только idx 1
  });
});
