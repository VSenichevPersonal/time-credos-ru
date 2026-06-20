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
  const standaloneIndexViews = views.filter(
    (v) => cfg<string>(v.res, 'key') === 'INDEX' && !isCardView(v.path),
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
