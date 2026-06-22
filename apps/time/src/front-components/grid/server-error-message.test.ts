import { describe, expect, it } from 'vitest';

import { serverErrorMessage } from 'src/front-components/grid/use-validation';
import { PERIOD_LOCKED_MESSAGE } from 'src/front-components/grid/period-lock';

// Маппинг машинных кодов /s/time-entry в понятный русский текст плашки.
describe('serverErrorMessage', () => {
  it('LOCKED_PERIOD → понятный текст про закрытый период (не сырой код)', () => {
    const msg = serverErrorMessage('LOCKED_PERIOD');
    expect(msg).toBe(PERIOD_LOCKED_MESSAGE);
    expect(msg).not.toContain('LOCKED_PERIOD');
    expect(msg).toContain('Период закрыт');
  });

  it('cannot_modify_approved → текст про согласование', () => {
    expect(serverErrorMessage('cannot_modify_approved')).toContain('Согласовано');
  });

  it('FORBIDDEN_ON_BEHALF → понятный текст про права on-behalf (не сырой код)', () => {
    const msg = serverErrorMessage('FORBIDDEN_ON_BEHALF');
    expect(msg).not.toContain('FORBIDDEN_ON_BEHALF');
    expect(msg).toContain('Нет прав');
    expect(msg).toContain('отдела');
  });

  it('hours out of range → текст про диапазон часов', () => {
    expect(serverErrorMessage('hours out of range')).toContain('диапазон');
  });

  it('employee not resolved → текст про сопоставление сотрудника', () => {
    expect(serverErrorMessage('employee not resolved')).toContain('администратору');
  });

  it('неизвестный код → общий fallback (не сырой код)', () => {
    const msg = serverErrorMessage('some_unknown_code');
    expect(msg).toBe('Сервер отклонил операцию. Изменение не сохранено.');
    expect(msg).not.toContain('some_unknown_code');
  });

  it('undefined → общий fallback', () => {
    expect(serverErrorMessage(undefined)).toContain('Сервер отклонил');
  });
});
