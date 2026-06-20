# Рецепты front-component поверхностей (SDK Twenty)

**Владелец:** Dev 1. **Зачем:** мы добавляем front-component'ы постоянно (доска, дашборд, виджеты карточек, настройки, календарь). Тут — **повторяемый рецепт** для каждого типа поверхности + SDK-грабли, набитые в реальных задачах. Не переизобретать.

> Перед кодом UI — [UI_PLAYBOOK.md](UI_PLAYBOOK.md) (Web Worker, нет host-DOM, фикс-виджет). Этот файл — про **регистрацию/вайринг**, тот — про **верстку внутри**.

## Среда (повтор главного)

Front-component исполняется в **Web Worker (Remote DOM)** — нет `getBoundingClientRect`/`window.inner*`/`document.*` (крашат). Доступно: React-хуки, `setTimeout`, `fetch` (через `RestApiClient`), SDK-хуки. Date/Math — ок. См. UI_PLAYBOOK §0.

## Общие кирпичи

- **Авто-дискавери:** файл `front-components/<name>.front-component.tsx` (или `main-page.tsx`) с `export default defineFrontComponent({...})` подхватывается манифестом. Реестр в `application-config.ts` НЕ нужен (кроме settingsCustomTab, см. ниже).
- **UUID:** новые — в `constants/universal-identifiers.ts`, **аппендом в конец, уникальным префиксом, с анонсом префикса в SIGNALS** (против гонки двух фронтов). Существующие UUID не трогать (потеря данных).
- **Данные:** Core REST через `RestApiClient` (`/rest/<objectPlural>`); серверные logic — `client().post('/s/<route>', body)` (см. `grid/approval-rest.ts`, `reports`).
- **Деплой:** новый front-component / правка page-layout = **нужен app sync** (`yarn twenty dev --once`). Dev 1 не пушит — собирает arch, синкает DevOps.

---

## Рецепт A — Раздел сайдбара (STANDALONE_PAGE)

Полноэкранная страница в меню. Примеры: `capacity-board` (Планирование), `calendar-monthly` (Производственный календарь).

**Файлы:**
1. `front-components/<feature>/<feature>.tsx` — корневой компонент (фикс-высота, `overflow:hidden`, скролл только тела).
2. `front-components/<feature>.front-component.tsx` — `defineFrontComponent({ universalIdentifier, name, description, component })`.
3. `constants/`: 5 UUID — `*_FRONT_COMPONENT`, `*_NAV`, `*_PAGE_LAYOUT`, `*_PAGE_LAYOUT_TAB`, `*_PAGE_WIDGET`.
4. `page-layouts/<feature>.page-layout.ts` — `definePageLayout({ type: 'STANDALONE_PAGE', tabs: [{ layoutMode: CANVAS, widgets: [{ type: 'FRONT_COMPONENT', configuration: { configurationType: 'FRONT_COMPONENT', frontComponentUniversalIdentifier } }] }] })`.
5. `navigation-menu-items/<feature>.navigation-menu-item.ts` — `defineNavigationMenuItem({ type: PAGE_LAYOUT, pageLayoutUniversalIdentifier, folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_... })`.

`layoutMode: CANVAS` для front-component-виджета (внутренний скролл разрешён). Эталон: `capacity-board.page-layout.ts`.

---

## Рецепт B — Виджет вкладки карточки (record-scoped)

Виджет на вкладке RECORD_PAGE, знающий текущую запись. Пример: «Команда» проекта (`project-team`).

**Контекст записи:** `useSelectedRecordIds()` из `twenty-sdk/front-component` → на record-page это `[recordId]`. Брать `const id = ids.length === 1 ? ids[0] : null` (НЕ deprecated `useRecordId`).

**Файлы:**
1. `front-components/<feature>/<feature>.tsx` — компонент, читает запись по `id` (REST по `projectId[eq]:id` и т.п.).
2. `front-components/<feature>.front-component.tsx` — def.
3. `constants/`: 1 UUID `*_FRONT_COMPONENT` (виджет/таб UUID карточки уже есть).
4. В нужном `page-layouts/<object>.page-layout.ts` — на вкладке: `layoutMode: CANVAS`, виджет `type: 'FRONT_COMPONENT'` + `frontComponentUniversalIdentifier`. (Заменяет placeholder `STANDALONE_RICH_TEXT`.)

---

## Рецепт C — Подраздел Settings (settingsCustomTab)

Вкладка в Settings воркспейса. Пример: «Настройки Time Credos» (`settings`).

**Регистрация (ЕДИНСТВЕННЫЙ случай, где нужен `application-config.ts`):**
```ts
defineApplication({
  ...,
  settingsCustomTabFrontComponentUniversalIdentifier: <UUID>,
});
```
**Файлы:** `front-components/<feature>/...` + `front-components/<feature>.front-component.tsx` + 1 UUID + поле в `application-config.ts`. page-layout/nav НЕ нужны.

---

## SDK-грабли (набито в задачах)

| Грабля | Симптом | Решение |
|---|---|---|
| `navigate('/objects/x')` строкой | `TS2345: not assignable to AppPath` | `navigate(AppPath.RecordIndexPage, { objectNamePlural: 'x' })` (import `AppPath`) |
| `getBoundingClientRect`/`window.innerHeight` | краш в воркере | направление поповера — структурный проп (UI_PLAYBOOK §2.1), без замеров |
| `window.addEventListener('keydown')` | не срабатывает (события в host-DOM) | React `onKeyDown` на контейнере |
| Новый front-component не в dry-run diff | кажется «не зарегался» | проверь `manifest.json` (`frontComponents[]`); краткая сводка dry-run page-layout не перечисляет — manifest = истина |
| Дубль `export const` UUID (два фронта) | битый build (redeclare) | аппенд в конец + уникальный префикс + анонс в SIGNALS |
| Object без index-view / view без navItem | не виден | см. apps/time/CLAUDE.md pitfalls |

## Чеклист перед `[signal-arch]` (новая поверхность)

- [ ] `export default defineFrontComponent` (не named для def-файла).
- [ ] UUID аппендом, уникальный префикс, анонс в SIGNALS.
- [ ] `yarn oxlint <files>` 0/0 + tsc по своим файлам чисто.
- [ ] grep crash-API (`getBoundingClientRect|window.inner|document.`) по своим файлам — пусто.
- [ ] Состояния: загрузка / пусто / ошибка REST.
- [ ] Чистый расчёт вынесен в `.ts` (под unit QA), если есть.
- [ ] Помечено «нужен app sync» в сигнале (новый front-component / правка page-layout).
