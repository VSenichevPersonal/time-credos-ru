import { describe, expect, it } from 'vitest';

import {
  DAILY_NORM_HOURS,
  fmtHours,
  fmtTotal,
  loadColor,
  loadHint,
  loadLevel,
  parseHours,
} from 'src/front-components/grid/format';
import { T } from 'src/front-components/grid/tokens';

describe('DAILY_NORM_HOURS', () => {
  it('= недельная норма / 5 = 8 ч', () => {
    expect(DAILY_NORM_HOURS).toBe(8);
  });
});

describe('fmtHours', () => {
  it('0 → пусто', () => {
    expect(fmtHours(0)).toBe('');
  });
  it('целое — без дробной части', () => {
    expect(fmtHours(8)).toBe('8');
  });
  it('дробное — без хвостовых нулей', () => {
    expect(fmtHours(2.5)).toBe('2.5');
    expect(fmtHours(0.25)).toBe('0.25');
  });
});

describe('fmtTotal', () => {
  it('0 или меньше → «—»', () => {
    expect(fmtTotal(0)).toBe('—');
    expect(fmtTotal(-1)).toBe('—');
  });
  it('>0 → как fmtHours', () => {
    expect(fmtTotal(8)).toBe('8');
    expect(fmtTotal(2.5)).toBe('2.5');
  });
});

describe('parseHours', () => {
  it('принимает точку и запятую', () => {
    expect(parseHours('2.5')).toBe(2.5);
    expect(parseHours('2,5')).toBe(2.5);
  });
  it('обрезает пробелы', () => {
    expect(parseHours(' 3 ')).toBe(3);
  });
  it('квантует к шагу 0.25', () => {
    expect(parseHours('3.13')).toBe(3.25);
    expect(parseHours('0.1')).toBe(0);
    expect(parseHours('0.25')).toBe(0.25);
  });
  it('диапазон 0..24, иначе null', () => {
    expect(parseHours('0')).toBe(0);
    expect(parseHours('24')).toBe(24);
    expect(parseHours('25')).toBeNull();
    expect(parseHours('-1')).toBeNull();
  });
  it('нечисловой ввод → null', () => {
    expect(parseHours('abc')).toBeNull();
    expect(parseHours('1.2.3')).toBeNull();
  });
  // Контракт UX: пустой/пробельный ввод = очистка ячейки в 0 ч (Number('')===0),
  // а не null. Фиксируем поведение, чтобы регрессия была видна.
  it('пустой ввод → 0 (очистка ячейки)', () => {
    expect(parseHours('')).toBe(0);
    expect(parseHours('   ')).toBe(0);
  });
});

describe('loadLevel', () => {
  const norm = 8;
  it('0 и меньше → empty', () => {
    expect(loadLevel(0, norm)).toBe('empty');
    expect(loadLevel(-2, norm)).toBe('empty');
  });
  it('строго выше нормы → over', () => {
    expect(loadLevel(9, norm)).toBe('over');
  });
  it('ровно норма → ok', () => {
    expect(loadLevel(8, norm)).toBe('ok');
  });
  it('между 0 и нормой → under', () => {
    expect(loadLevel(5, norm)).toBe('under');
  });
});

describe('loadColor', () => {
  it('маппит уровень на токен цвета', () => {
    expect(loadColor('over')).toBe(T.over);
    expect(loadColor('ok')).toBe(T.ok);
    expect(loadColor('under')).toBe(T.text);
    expect(loadColor('empty')).toBe(T.textFaint);
  });
});

describe('loadHint', () => {
  const norm = 8;
  it('нет записей при пустой загрузке', () => {
    expect(loadHint(0, norm)).toBe('нет записей');
  });
  it('переработка с дельтой', () => {
    expect(loadHint(10.5, norm)).toBe('переработка +2.5 ч');
  });
  it('норма выполнена', () => {
    expect(loadHint(8, norm)).toBe('норма выполнена');
  });
  it('недобор с дельтой', () => {
    expect(loadHint(5.5, norm)).toBe('недобор 2.5 ч');
  });
});
