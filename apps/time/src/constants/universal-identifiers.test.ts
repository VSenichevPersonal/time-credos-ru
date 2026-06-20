import { describe, expect, it } from 'vitest';

import * as ids from 'src/constants/universal-identifiers';

// Guard-тест UUID-SSOT. CLAUDE.md: «All generated UUIDs must be valid UUID v4».
// ADR-0004: UUID стабильны и НЕ меняются при рефакторе нейминга.
// Дубль UUID = коллизия сущностей в общем workspace (потеря данных при sync) —
// этот тест ловит такое до накатки.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Все строковые экспорты, похожие на UUID (имя кончается на ..._IDENTIFIER или ..._FIELD_ID
// и значение — 36-символьная строка с дефисами).
const uuidEntries: Array<[string, string]> = Object.entries(ids).filter(
  ([, v]): v is string => typeof v === 'string' && v.length === 36 && v.includes('-'),
);

describe('universal-identifiers (UUID-SSOT)', () => {
  it('найдены UUID-константы (sanity: модуль не пуст)', () => {
    expect(uuidEntries.length).toBeGreaterThan(40);
  });

  it.each(uuidEntries)('%s — валидный UUID v4', (_name, value) => {
    expect(value).toMatch(UUID_V4);
  });

  it('все UUID уникальны (нет коллизий)', () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const [name, value] of uuidEntries) {
      const lower = value.toLowerCase();
      const prev = seen.get(lower);
      if (prev) dups.push(`${value}: ${prev} ↔ ${name}`);
      else seen.set(lower, name);
    }
    expect(dups).toEqual([]);
  });
});
