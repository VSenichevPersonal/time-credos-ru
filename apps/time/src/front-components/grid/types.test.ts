import { describe, expect, it } from 'vitest';

import { makeRowKey, splitRowKey } from './types';

describe('makeRowKey', () => {
  it('формирует ключ через "|"', () => {
    expect(makeRowKey('proj-1', 'wt-2')).toBe('proj-1|wt-2');
  });

  it('UUIDs', () => {
    const key = makeRowKey(
      '550e8400-e29b-41d4-a716-446655440000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    );
    expect(key).toBe(
      '550e8400-e29b-41d4-a716-446655440000|f47ac10b-58cc-4372-a567-0e02b2c3d479',
    );
  });

  it('пустые строки → "|"', () => {
    expect(makeRowKey('', '')).toBe('|');
  });
});

describe('splitRowKey', () => {
  it('разбирает обратно', () => {
    expect(splitRowKey('proj-1|wt-2')).toEqual({ projectId: 'proj-1', workTypeId: 'wt-2' });
  });

  it('makeRowKey round-trip — splitRowKey(makeRowKey(p,w)) = {p,w}', () => {
    const p = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const w = '01234567-89ab-cdef-0123-456789abcdef';
    expect(splitRowKey(makeRowKey(p, w))).toEqual({ projectId: p, workTypeId: w });
  });

  it('три сегмента — берёт только первые два (split деструктурирует [0],[1])', () => {
    const { projectId, workTypeId } = splitRowKey('p1|w1|extra');
    expect(projectId).toBe('p1');
    expect(workTypeId).toBe('w1'); // 'extra' отброшен
  });
});
