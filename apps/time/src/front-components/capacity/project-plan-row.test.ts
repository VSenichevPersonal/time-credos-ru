import { describe, expect, it } from 'vitest';

import {
  parseEffort,
  planEffortFromInput,
} from 'src/front-components/capacity/project-plan-row';

// БАГ заказчика: «в планировании если пишу 0 в строке проекта — ОШИБКА».
// Причина — 0 порождал валидный, но бессмысленный патч {plannedEffort:0,
// startDate:today}, а 0-часовой план + авто-дата = мусор/REST-шум. Семантика 0 в
// строке = «снять план» (null). Тут фиксируем чистую логику строки (env=node, без
// mount компонента): parseEffort и planEffortFromInput (решение что сохранять).

describe('parseEffort строки проекта', () => {
  it('пусто → null (очистить)', () => {
    expect(parseEffort('')).toBeNull();
    expect(parseEffort('   ')).toBeNull();
  });

  it('0 → 0 (валидное число, не undefined)', () => {
    expect(parseEffort('0')).toBe(0);
    expect(parseEffort('0,0')).toBe(0);
    expect(parseEffort('0.00')).toBe(0);
  });

  it('положительное → число (запятая как точка, округление 2 знака)', () => {
    expect(parseEffort('40')).toBe(40);
    expect(parseEffort('1,5')).toBe(1.5);
    expect(parseEffort('1.234')).toBe(1.23);
  });

  it('отрицательное/нечисло → undefined (не сохраняем)', () => {
    expect(parseEffort('-5')).toBeUndefined();
    expect(parseEffort('abc')).toBeUndefined();
  });
});

describe('planEffortFromInput — решение строки (0 = снять план)', () => {
  it('0 → effort null (снять план, НЕ ошибка)', () => {
    expect(planEffortFromInput('0')).toEqual({ skip: false, effort: null });
    expect(planEffortFromInput('0,0')).toEqual({ skip: false, effort: null });
  });

  it('пусто → effort null (очистить)', () => {
    expect(planEffortFromInput('')).toEqual({ skip: false, effort: null });
  });

  it('положительное → effort = число', () => {
    expect(planEffortFromInput('40')).toEqual({ skip: false, effort: 40 });
    expect(planEffortFromInput('1,5')).toEqual({ skip: false, effort: 1.5 });
  });

  it('невалидное (отриц./нечисло) → skip (revert, ничего не шлём)', () => {
    expect(planEffortFromInput('-1')).toEqual({ skip: true });
    expect(planEffortFromInput('xyz')).toEqual({ skip: true });
  });
});
