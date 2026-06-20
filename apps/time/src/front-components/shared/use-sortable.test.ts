import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мокируем useState: возвращает [initialValue, setter].
// Это позволяет тестировать sort/toggle-логику без React-рантайма.
vi.mock('react', () => ({
  useState: vi.fn((init: unknown) => [init, vi.fn()]),
}));

import { useSortable } from './use-sortable';

// Ключи сортировки для тестов
type K = 'name' | 'fact' | 'util';

const rows = [
  { name: 'Бета', fact: 20 },
  { name: 'Альфа', fact: 5 },
  { name: 'Гамма', fact: 12 },
];

describe('useSortable — sort (числовой key)', () => {
  it('defaultKey=null → rows без изменений (sort не применяется)', () => {
    const { sort } = useSortable<K>();
    const result = sort(rows, (r) => r.fact);
    // key=null → возвращаем оригинал
    expect(result).toEqual(rows);
  });

  it('key=fact, dir=desc → убывание по fact', () => {
    const { sort } = useSortable<K>('fact', 'desc');
    const result = sort(rows, (r) => r.fact);
    expect(result.map((r) => r.fact)).toEqual([20, 12, 5]);
  });

  it('key=fact, dir=asc → возрастание по fact', () => {
    const { sort } = useSortable<K>('fact', 'asc');
    const result = sort(rows, (r) => r.fact);
    expect(result.map((r) => r.fact)).toEqual([5, 12, 20]);
  });

  it('не мутирует оригинальный массив', () => {
    const { sort } = useSortable<K>('fact', 'desc');
    const orig = [...rows];
    sort(rows, (r) => r.fact);
    expect(rows).toEqual(orig);
  });
});

describe('useSortable — sort (строковый key)', () => {
  it('key=name, dir=asc → алфавитный порядок (ru locale)', () => {
    const { sort } = useSortable<K>('name', 'asc');
    const result = sort(rows, (r) => r.name);
    // localeCompare('ru'): Альфа < Бета < Гамма
    expect(result.map((r) => r.name)).toEqual(['Альфа', 'Бета', 'Гамма']);
  });

  it('key=name, dir=desc → обратный алфавитный', () => {
    const { sort } = useSortable<K>('name', 'desc');
    const result = sort(rows, (r) => r.name);
    expect(result.map((r) => r.name)).toEqual(['Гамма', 'Бета', 'Альфа']);
  });
});

describe('useSortable — sort: edge cases', () => {
  it('пустой массив → пустой', () => {
    const { sort } = useSortable<K>('fact', 'desc');
    expect(sort([], (r: { fact: number }) => r.fact)).toEqual([]);
  });

  it('один элемент → тот же', () => {
    const { sort } = useSortable<K>('fact', 'desc');
    const one = [{ name: 'X', fact: 7 }];
    expect(sort(one, (r) => r.fact)).toEqual(one);
  });

  it('равные значения → стабильный порядок', () => {
    const { sort } = useSortable<K>('fact', 'desc');
    const equal = [
      { name: 'A', fact: 10 },
      { name: 'B', fact: 10 },
    ];
    const result = sort(equal, (r) => r.fact);
    expect(result.map((r) => r.name)).toEqual(['A', 'B']);
  });
});

describe('useSortable — toggle логика (через state)', () => {
  beforeEach(async () => {
    const { useState } = await import('react');
    (useState as ReturnType<typeof vi.fn>).mockImplementation((init: unknown) => [init, vi.fn()]);
  });

  it('toggle по другому ключу → setKey(newKey) + setDir("desc")', async () => {
    const setKeyMock = vi.fn();
    const setDirMock = vi.fn();
    const { useState } = await import('react');
    (useState as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(['fact', setKeyMock])
      .mockReturnValueOnce(['asc', setDirMock]);

    const { toggle } = useSortable<K>('fact', 'asc');
    toggle('name');
    expect(setKeyMock).toHaveBeenCalledWith('name');
    expect(setDirMock).toHaveBeenCalledWith('desc');
  });

  it('toggle по тому же ключу → setDir(fn) меняет asc↔desc', async () => {
    const setKeyMock = vi.fn();
    const setDirMock = vi.fn();
    const { useState } = await import('react');
    (useState as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(['fact', setKeyMock])
      .mockReturnValueOnce(['asc', setDirMock]);

    const { toggle } = useSortable<K>('fact', 'asc');
    toggle('fact');
    expect(setKeyMock).not.toHaveBeenCalled();
    expect(setDirMock).toHaveBeenCalledWith(expect.any(Function));
    const fn = setDirMock.mock.calls[0][0] as (d: string) => string;
    expect(fn('asc')).toBe('desc');
    expect(fn('desc')).toBe('asc');
  });
});
