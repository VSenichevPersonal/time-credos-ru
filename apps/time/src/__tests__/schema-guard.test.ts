/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

// Schema-guard: статические инварианты SDK-определений без живого сервера.
// Ловит pitfalls из apps/time/CLAUDE.md и нейминг ADR-0004 ДО `app sync`.
// Импорт всех модулей через Vite import.meta.glob (eager).

type SdkResult = {
  success: boolean;
  config: Record<string, unknown>;
  errors: unknown[];
  warnings: unknown[];
};

const collect = (mods: Record<string, unknown>): Array<{ path: string; res: SdkResult }> =>
  Object.entries(mods).map(([path, m]) => ({
    path: path.split('/').pop() ?? path,
    res: (m as { default: SdkResult }).default,
  }));

const objects = collect(import.meta.glob('../objects/*.object.ts', { eager: true }));
const views = collect(import.meta.glob('../views/*.view.ts', { eager: true }));
const navs = collect(
  import.meta.glob('../navigation-menu-items/*.navigation-menu-item.ts', { eager: true }),
);
const pageLayouts = collect(import.meta.glob('../page-layouts/*.page-layout.ts', { eager: true }));

const cfg = <T = unknown>(res: SdkResult, key: string): T => res.config[key] as T;

// Card-вид = INDEX-вид, встроенный вкладкой в page-layout карточки (не пункт сайдбара).
// Имя файла содержит `-card-`. Для таких nav-item не нужен — проверяем привязку к layout.
const isCardView = (path: string): boolean => /-card-/.test(path);

// Registry-вид = технический INDEX-вид для join-объектов, управляемых через карточку
// другой сущности. SDK требует хотя бы одну view для объекта, но UI-навигация не нужна.
// Добавлять сюда только по согласованию с arch (комментарий в view обязателен).
const REGISTRY_VIEWS = new Set([
  'credos-time-project-department.view.ts', // управление в карточке проекта (REQ-0013)
  'credos-time-employee-department.view.ts', // управление в карточке сотрудника (REQ-0011)
]);
const isRegistryView = (path: string): boolean => REGISTRY_VIEWS.has(path);

// Technical-вид = INDEX-вид технического объекта, редактируемого ТОЛЬКО через
// front-панели (project-plan-panel / employee-plan-panel), не напрямую. nav-item
// намеренно убран из сайдбара (B4/B5 аудит): нативный object-view показывал сырые
// слоты + кнопка «+Создать» = источник мусорных записей. Объект+view остаются
// (для админ-доступа по прямой ссылке + SDK-pitfall требует index-view).
// Добавлять сюда только по согласованию с arch (комментарий в view обязателен).
const TECHNICAL_VIEWS = new Set([
  'credos-time-plan-slot.view.ts', // план правится через панели «Планировать» (B4)
]);
const isTechnicalView = (path: string): boolean => TECHNICAL_VIEWS.has(path);

// Все UUID, встречающиеся в конфигурациях page-layouts (для проверки привязки card-вкладок).
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const layoutReferencedUuids = new Set(
  pageLayouts.flatMap((p) => JSON.stringify(p.res.config).match(UUID_RE) ?? []),
);

describe('schema-guard: SDK-определения валидны (success + без errors)', () => {
  it.each([...objects, ...views, ...navs].map((x) => [x.path, x.res] as const))(
    '%s — success=true, errors пуст',
    (_path, res) => {
      expect(res.success).toBe(true);
      expect(res.errors).toEqual([]);
    },
  );
});

describe('нейминг credosTime (ADR-0004)', () => {
  it.each(objects.map((o) => [o.path, o.res] as const))(
    '%s — nameSingular/namePlural с префиксом credosTime',
    (_path, res) => {
      expect(cfg<string>(res, 'nameSingular')).toMatch(/^credosTime/);
      expect(cfg<string>(res, 'namePlural')).toMatch(/^credosTime/);
    },
  );
});

describe('pitfall: у каждого объекта есть INDEX-view', () => {
  const indexViewObjectIds = new Set(
    views
      .filter((v) => cfg<string>(v.res, 'key') === 'INDEX')
      .map((v) => cfg<string>(v.res, 'objectUniversalIdentifier')),
  );

  it.each(objects.map((o) => [o.path, o.res] as const))(
    '%s — есть view с key=INDEX, ссылающаяся на объект',
    (_path, res) => {
      expect(indexViewObjectIds).toContain(cfg<string>(res, 'universalIdentifier'));
    },
  );
});

describe('pitfall: у каждой INDEX-view есть navigationMenuItem', () => {
  const navViewIds = new Set(
    navs
      .filter((n) => cfg<string>(n.res, 'type') === 'VIEW')
      .map((n) => cfg<string>(n.res, 'viewUniversalIdentifier')),
  );
  // Standalone INDEX-виды (сайдбар) — должен быть nav-item.
  // Registry-views (join-объекты) исключены: управляются через карточку, nav не нужен.
  // Technical-views исключены: редактируются через front-панели, nav скрыт намеренно (B4).
  const standaloneIndexViews = views.filter(
    (v) =>
      cfg<string>(v.res, 'key') === 'INDEX' &&
      !isCardView(v.path) &&
      !isRegistryView(v.path) &&
      !isTechnicalView(v.path),
  );

  it.each(standaloneIndexViews.map((v) => [v.path, v.res] as const))(
    '%s — на standalone INDEX-view ссылается nav-item',
    (_path, res) => {
      expect(navViewIds).toContain(cfg<string>(res, 'universalIdentifier'));
    },
  );
});

describe('card-вкладки: INDEX-вид без nav обязан быть в page-layout', () => {
  const cardIndexViews = views.filter(
    (v) => cfg<string>(v.res, 'key') === 'INDEX' && isCardView(v.path),
  );

  it.each(cardIndexViews.map((v) => [v.path, v.res] as const))(
    '%s — uid встречается в page-layout (встроена вкладкой)',
    (_path, res) => {
      expect(layoutReferencedUuids).toContain(cfg<string>(res, 'universalIdentifier'));
    },
  );
});

describe('целостность ссылок: view→объект и nav→view не висячие', () => {
  const objectIds = new Set(objects.map((o) => cfg<string>(o.res, 'universalIdentifier')));
  const viewIds = new Set(views.map((v) => cfg<string>(v.res, 'universalIdentifier')));

  it.each(views.map((v) => [v.path, v.res] as const))(
    '%s — objectUniversalIdentifier существует',
    (_path, res) => {
      expect(objectIds).toContain(cfg<string>(res, 'objectUniversalIdentifier'));
    },
  );

  it.each(navs.filter((n) => cfg<string>(n.res, 'type') === 'VIEW').map((n) => [n.path, n.res] as const))(
    '%s — viewUniversalIdentifier существует',
    (_path, res) => {
      expect(viewIds).toContain(cfg<string>(res, 'viewUniversalIdentifier'));
    },
  );
});

// --- Поля объектов ---
type FieldDef = {
  universalIdentifier: string;
  name: string;
  type: string;
  options?: Array<{ value: string }>;
};
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fieldsByObject = objects.map((o) => ({
  path: o.path,
  fields: (cfg<FieldDef[]>(o.res, 'fields') ?? []) as FieldDef[],
}));
const allFields = fieldsByObject.flatMap((o) => o.fields.map((f) => ({ obj: o.path, f })));

describe('поля объектов: UUID + нейминг', () => {
  it.each(allFields.map(({ obj, f }) => [`${obj}:${f.name}`, f] as const))(
    '%s — universalIdentifier валидный UUID v4',
    (_label, f) => {
      expect(f.universalIdentifier).toMatch(UUID_V4);
    },
  );

  it.each(allFields.map(({ obj, f }) => [`${obj}:${f.name}`, f] as const))(
    '%s — name camelCase, непустой',
    (_label, f) => {
      expect(f.name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    },
  );
});

describe('поля: уникальность имён внутри объекта', () => {
  it.each(fieldsByObject.map((o) => [o.path, o.fields] as const))(
    '%s — имена полей уникальны',
    (_path, fields) => {
      const names = fields.map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
    },
  );
});

describe('поля: глобальная уникальность UUID (нет коллизий сущностей)', () => {
  it('все UUID полей уникальны и не пересекаются с object/view/nav UUID', () => {
    const fieldIds = allFields.map(({ f }) => f.universalIdentifier.toLowerCase());
    const entityIds = [
      ...objects.map((o) => cfg<string>(o.res, 'universalIdentifier')),
      ...views.map((v) => cfg<string>(v.res, 'universalIdentifier')),
      ...navs.map((n) => cfg<string>(n.res, 'universalIdentifier')),
    ].map((id) => id.toLowerCase());

    const all = [...fieldIds, ...entityIds];
    expect(new Set(all).size).toBe(all.length);
  });
});

// --- Индексы ---
const indexes = collect(import.meta.glob('../indexes/*.index.ts', { eager: true }));

describe('indexes: UUID v4 + ссылка на существующий объект', () => {
  const objectIds = new Set(objects.map((o) => cfg<string>(o.res, 'universalIdentifier')));

  it.each(indexes.map((i) => [i.path, i.res] as const))(
    '%s — universalIdentifier валидный UUID v4',
    (_path, res) => {
      expect(cfg<string>(res, 'universalIdentifier')).toMatch(UUID_V4);
    },
  );

  it.each(indexes.map((i) => [i.path, i.res] as const))(
    '%s — objectUniversalIdentifier ссылается на известный объект',
    (_path, res) => {
      expect(objectIds).toContain(cfg<string>(res, 'objectUniversalIdentifier'));
    },
  );

  it.each(
    indexes.flatMap((i) => {
      const fields = (cfg<Array<{ universalIdentifier: string; fieldUniversalIdentifier: string }>>(i.res, 'fields') ?? []);
      return fields.map((f, idx) => [`${i.path}:field[${idx}]`, f] as const);
    })
  )(
    '%s — universalIdentifier и fieldUniversalIdentifier валидные UUID v4',
    (_label, f) => {
      expect(f.universalIdentifier).toMatch(UUID_V4);
      expect(f.fieldUniversalIdentifier).toMatch(UUID_V4);
    },
  );
});

describe('поля SELECT: непустой набор options', () => {
  const selectFields = allFields.filter(({ f }) => f.type === 'SELECT');

  it('есть хотя бы одно SELECT-поле (sanity)', () => {
    expect(selectFields.length).toBeGreaterThan(0);
  });

  it.each(selectFields.map(({ obj, f }) => [`${obj}:${f.name}`, f] as const))(
    '%s — options непустой',
    (_label, f) => {
      expect(Array.isArray(f.options)).toBe(true);
      expect((f.options ?? []).length).toBeGreaterThan(0);
    },
  );
});
