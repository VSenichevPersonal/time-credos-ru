# Core Changes Log

Document any modifications to Twenty CRM core files here.
This helps track upstream merge conflicts and understand deviations from vanilla Twenty.

## Format

```
### [Date] — Description
- **File:** path/to/modified/file
- **Reason:** why the change was necessary
- **Risk:** merge conflict likelihood (low/medium/high)
```

## Changes

### 2026-06-11 — Settings → Кредо-С → Unisender: путь, роут, пункт навигации (волна D)

### `packages/twenty-shared/src/types/SettingsPath.ts` + `SettingsRoutes.tsx` + `useSettingsNavigationItems.tsx`

- **Files:** `SettingsPath.ts` (+1 enum value `CredosUnisender = 'credos-unisender'`), `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` (+lazy import +Route), `packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx` (+IconSend import +пункт «Unisender» в секции Кредо-С)
- **Change:** регистрация страницы настроек ABM-рассылок `~/credos/unisender/pages/SettingsCredosUnisender` (7 блоков по спеке CRM Analyst). Вся логика — в `credos/unisender/` (зелёная зона), ядро содержит только enum value + lazy route + nav item.
- **Reason:** direction user «не хватает в настройках блока Unisender — по аналогии с 1С, телефонией»; arch-ok «Settings-страница ПЕРВОЙ задачей волны D».
- **Risk:** Low — паттерн идентичен CredosReports/CredosProfile регистрациям (те же 3 файла).
- **Markers:** inline `// CREDOS:` на enum value, import и nav item; `{/* CREDOS: ... */}` на Route; `// CREDOS:`-комментарии на lazy-блоке.

---

### 2026-06-11 — Регистрация ABM card layouts: credosMailing + credosCampaignMember (волна D)

### `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts` + `hooks/useBasePageLayout.ts`

- **Files:** `getDefaultRecordPageLayoutId.ts` (+2 imports, +2 map entries), `useBasePageLayout.ts` (+4 imports, +2 case в `getDefaultLayoutById`, +2 строки в `isDefaultLayoutId`)
- **Change:** регистрация двух новых credos-layout'ов: `DEFAULT_CREDOS_MAILING_RECORD_PAGE_LAYOUT` (табы «Получатели» + «Журнал» на карточке Рассылки) и `DEFAULT_CREDOS_CAMPAIGN_MEMBER_RECORD_PAGE_LAYOUT` (таб «Письма» на карточке Участника кампании). Сами layout'ы и виджеты — в `~/credos/page-layout/constants/` (зелёная зона), ядро содержит только map/case-регистрацию.
- **Reason:** arch-ok «таб „Получатели" на рассылке + таб „Письма" на участнике → Dev 1» (спека 19 §2, видимость писем per-получатель — вопрос user). Используется существующий generic `CredosFieldWidgetRelationTable` — нового рендер-кода в ядре нет.
- **Risk:** Low — паттерн идентичен 7 существующим credos-layout регистрациям в этих же файлах; при upstream-конфликте блоки переносятся механически.
- **Markers:** `// CREDOS-BEGIN`/`// CREDOS-END` на import/map/case блоках + 2 inline `// CREDOS: ABM` в `isDefaultLayoutId`.

---

### 2026-05-20 — FieldWidget collapsible sections marker dispatch (#LEAD-CARD-COLLAPSIBLE-SECTIONS)

### `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`

- **File:** `FieldWidget.tsx` — +1 import block (`CredosLeadSection` + section constants) + `// CREDOS-BEGIN`/`// CREDOS-END` block перед EMAIL_VIEWER marker check. Если `fieldMetadataId.startsWith('__credos_lead_section_')` — резолвим section через `CREDOS_LEAD_SECTION_BY_MARKER` и рендерим `<CredosLeadSection sectionId={section.id} />`.
- **Change:** marker-based widget dispatch для 6 секций sidebar карточки credosLead. Логика секции (collapsible state, рендер списка полей) — в `~/credos/lead-collector/components/CredosLeadSection.tsx` (95 LOC) + hook `useCredosLeadSectionFields.ts` (50 LOC) + atom `credosLeadSectionCollapsedAtomFamily`.
- **Reason:** user direction 07:20 — «маловато полей в карточке + надо чтобы при конвертации lead → contact данных хватало». Arch foundation (commit `88b19f7b31`) подменил single FIELDS widget в `DefaultCredosLeadRecordPageLayout.ts` на массив 6 FIELD widget'ов с markers. Этот diff — render-side: marker → React tree. Default Twenty FieldWidget логика для real fields не затронута.
- **Risk:** Low — паттерн зеркалит существующие markers (`__credos_lead_email_viewer`, `__credos_status`, `__credos_company_status`, `__credos_1c`, `__credos_beeline_recording`). При upstream rename `FieldWidget` маркер-блок переносится в новый renderer.
- **Markers:** `// CREDOS:` на 1 import block + `// CREDOS-BEGIN`/`// CREDOS-END` block.

---

### 2026-05-20 — FieldsWidget viewId fallback для credos* объектов (#LEAD-CARD-SIDEBAR-LAYOUT-APPLY)

### `packages/twenty-front/src/modules/page-layout/widgets/fields/components/FieldsWidget.tsx`

- **File:** `FieldsWidget.tsx` — добавлен 1 import + блок `useCredosDefaultViewIdForWidget` + замена `fieldsConfiguration.viewId ?? null` на `resolvedViewId` в 2 вызовах (groups + hiddenFields).
- **Change:** при `configuration.viewId === null` и `objectNameSingular.startsWith('credos')` — резолвим index view объекта вместо рендера всех active полей. Логика — в hook'е `~/credos/page-layout/hooks/useCredosDefaultViewIdForWidget.ts`. Для ванильных объектов поведение не меняется (early return когда префикс не `credos*`).
- **Reason:** `DefaultCredosLeadRecordPageLayout.ts` хранит FIELDS widget с `viewId: null` (статический layout без знания UUID workspace view). Без резолва Twenty рендерит ВСЕ active поля credosLead в sidebar, игнорируя `viewField.isVisible` из `setup-credos-lead-field-order.sh`. Пользователь видит 14+ raw полей включая дубли email payload. Через резолв index view (та же что patch'ит setup-script) sidebar уважает 6-секционную планировку из `CRM_LEAD_CARD_FIELD_LAYOUT_2026-05-18.md` (20 visible + 10 hidden).
- **Risk:** Low — изоляция через `credos` префикс. При upstream rename `useFieldsWidgetGroupsForDisplay`/`useFieldsWidgetHiddenFieldsForDisplay` потребуется перенести вызов hook'а.
- **Markers:** `// CREDOS:` на 1 import + `// CREDOS-BEGIN`/`// CREDOS-END` block.

---

### 2026-05-18 — DefaultCredosLeadRecordPageLayout + «📧 Письмо» tab (#LEAD-CARD-EMAIL-VIEW v3)

### `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts` + `packages/twenty-front/src/modules/page-layout/hooks/useBasePageLayout.ts`

- **Files:**
  - `getDefaultRecordPageLayoutId.ts` — добавлен mapping `credosLead → DEFAULT_CREDOS_LEAD_RECORD_PAGE_LAYOUT_ID` (+1 import + 1 строка map)
  - `useBasePageLayout.ts` — добавлен switch-case + isDefaultLayoutId branch (+2 import + 1 case + 1 OR-branch)
- **Change:** новый custom layout для `credosLead` объекта с табом «📧 Письмо» который использует marker `__credos_lead_email_viewer` для рендера full-width `CredosLeadEmailViewer` (rendered HTML iframe + plain body). Tab position 150 (между Главное:100 и Timeline:500). Default Twenty tabs (Tasks/Notes/Files/Timeline) сохранены.
- **Reason:** UX-улучшение — email viewer теперь отдельный таб в карточке лида (по аналогии с «Взаимодействия» табом у credosContact), а не inline override на поле credosSourceEmailHtml. Пользователь может полноразмерно читать письма как в почтовом клиенте, не путаясь с raw HTML markup.
- **Risk:** Low — паттерн зеркалит существующий DefaultCredosContactRecordPageLayout. При upstream merge — если Twenty переименует hook'и (`useBasePageLayout`, `getDefaultRecordPageLayoutId`) — мигрировать наш case-branch в новую модель.
- **Markers:** `// CREDOS:` на 2 import'а + 1 case + 1 OR-branch + 1 map entry.

---

### 2026-05-18 — Lead Email Viewer override в FieldWidget.tsx (#LEAD-CARD-EMAIL-VIEW)

### `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`

- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:**
  - +1 строка import: `import { CredosLeadEmailViewer } from '~/credos/lead-collector/components/CredosLeadEmailViewer';`
  - +1 константа маркера: `const CREDOS_LEAD_EMAIL_VIEWER_MARKER = '__credos_lead_email_viewer';`
  - +~12 строк marker branch (для optional custom page layout): рендерит `CredosLeadEmailViewer` когда `fieldMetadataId === CREDOS_LEAD_EMAIL_VIEWER_MARKER`
  - +9 строк companion-hook: `credosLeadEmailBody = useAtomFamilySelectorValue(... fieldName: 'credosSourceEmailBody')` — unconditional, для override branch ниже
  - +~13 строк field-name override branch: когда `fieldMetadataItem.name === 'credosSourceEmailHtml'` AND `objectMetadataItem.nameSingular === 'credosLead'` → возвращает `<CredosLeadEmailViewer />` вместо default TEXT renderer
- **Reason:** дефолтный TEXT-field renderer в record-page показывает raw HTML markup (`<div style="...">...</div>`) пользователю как plain text — user видит «абракадабру». Override-branch заменяет на двухтабную панель: `📧 Текст` (pre-formatted multiline) + `🌐 HTML` (sandboxed iframe через existing `/rest/credos/lead/:id/email-html`).
- **Risk:** Low — override срабатывает строго на 1 поле 1 объекта (`credosSourceEmailHtml` на `credosLead`). Все другие fields рендерятся как раньше. Iframe sandbox="" блокирует скрипты/формы — XSS-safe.
- **Markers:** `// CREDOS:` на import + marker constant, `// CREDOS-BEGIN ... // CREDOS-END` на 2 branches (marker + field-name override).
- **Audit:** `grep -n "// CREDOS" packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx` → 6+ матчей.
- **На merge upstream:** если Twenty переписал `FieldWidget` (например, dispatch system или новая extension API) — мигрировать оба маркера в новую модель. Marker `__credos_lead_email_viewer` зарезервирован для будущих custom layouts.

---

### 2026-04-27 — Security headers пакетом (RISK-010..013)

CISO findings #9-#12 закрыты в `packages/twenty-server/src/main.ts` одним коммитом — CORS whitelist, HSTS, helmet, x-powered-by off.

- **File:** `packages/twenty-server/src/main.ts`
- **Change:**
  - `cors: true` → `cors: process.env.APP_FRONT_BASE_URL ? { origin: <split>, credentials: true } : (NODE_ENV==='development')` — wildcard заменён на whitelist
  - `app.disable('x-powered-by')` — скрываем `X-Powered-By: Express`
  - `app.use(helmet({ contentSecurityPolicy: false, hsts: { maxAge: 31_536_000, includeSubDomains: true } }))` — HSTS + X-Frame-Options + X-Content-Type-Options + ряд других. CSP off (Linaria inline-стили в Twenty)
  - +1 import: `import helmet from 'helmet';`
- **Reason:** RISK-010 (CORS leak), RISK-011 (SSL stripping), RISK-012 (information disclosure), RISK-013 (clickjacking/MIME-sniffing). Все четыре идут одним пакетом — общий поверхностный слой на bootstrap.
- **Markers:** 4 CREDOS-маркера: `// CREDOS-BEGIN: prod CORS whitelist (RISK-010)` … `// CREDOS-END`, `// CREDOS: hide tech stack (RISK-012)`, `// CREDOS-BEGIN: security headers via helmet (RISK-011/013)` … `// CREDOS-END`, `// CREDOS: security headers (RISK-011/012/013) — see ...` на import
- **Risk:** Medium — `main.ts` редко правится в upstream, но любая правка в bootstrap может конфликтовать. Pattern: оборачиваем в `// CREDOS-BEGIN/END`, чтобы при merge можно было быстро восстановить.
- **Env:** `APP_FRONT_BASE_URL=https://credoscrm1.up.railway.app` обязателен в prod (Railway → Variables). Multi-origin: `https://app.credos.ru,https://staging.credos.ru`. В dev fallback на `cors: true` (Vite на localhost).
- **Verify after deploy:**
  ```bash
  curl -I https://credoscrm1.up.railway.app
  # ожидается: Strict-Transport-Security, X-Frame-Options: DENY,
  # X-Content-Type-Options: nosniff, нет X-Powered-By
  ```

### 2026-04-24 — Beeline Webhook: exclude from global REST JWT middleware

- **File:** `packages/twenty-server/src/app.module.ts`
- **Change:** `.exclude({ path: 'rest/credos/beeline/webhook', method: RequestMethod.POST })` в цикл регистрации `RestCoreMiddleware`. Без этого Beeline Cloud PBX получал 403 — middleware отклоняет запросы без JWT до контроллера.
- **Reason:** `BeelineWebhookController` — публичный endpoint, аутентифицируется по shared-secret, не по JWT.
- **Risk:** low — `.exclude()` затрагивает только один маршрут
- **Markers:** `// CREDOS: Beeline webhook — публичный, auth по shared-secret`

### 2026-06-05 — 1С webhook: extend exclude list (#ONEC-AUTH-BASIC follow-up)

- **File:** `packages/twenty-server/src/app.module.ts`
- **Change:** добавлены 2 route'а к `.exclude()` цикла `RestCoreMiddleware`:
  - `rest/credos/oneC/webhook` (POST)
  - `rest/credos/oneC/webhook/batch` (POST)
  Старый комментарий заменён на блочный `// CREDOS-BEGIN ... // CREDOS-END` с двумя routes.
- **Reason:** `CredosOneCController` — публичный endpoint для 1С odata-клиента (HTTP Basic auth через `CredosOneCAuthGuard`, не JWT). До этого global RestCoreMiddleware ловил все `/rest/*` → JWT decode → `Missing authentication token` (403) ещё до `@UseGuards(CredosOneCAuthGuard)`.
- **Risk:** low — exclude пары точечных POST routes, остальные `/rest/credos/*` остаются под JWT.
- **Markers:** `// CREDOS-BEGIN: webhook routes публичные ...` / `// CREDOS-END`

### 2026-04-24 — Beeline Recording Player Widget (Dev Report #023)

Виджет плеера записи звонка в карточке `credosActivity`. Использует уже
существующий в проекте паттерн маркер-поля (`__credos_<name>` → кастомный
React-компонент), добавляя одну новую ветку рендера.

- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:** +1 строка импорта (`CredosCallRecordingPlayer`), +1 строка константы маркера
  (`CREDOS_BEELINE_RECORDING_MARKER = '__credos_beeline_recording'`), +4 строки
  в блок маркер-проверок (`if (fieldMetadataId === CREDOS_BEELINE_RECORDING_MARKER) return <CredosCallRecordingPlayer activityId={targetRecord.id} />`)
- **Reason:** штатная точка extension-based кастомизации Show Page. Layout
  `DefaultCredosActivityRecordPageLayout.ts` уже содержит `FIELD`-виджет
  с этим маркером, рендер подменяется здесь в рантайме
- **Markers:** все 3 правки обёрнуты `// CREDOS:` / `// CREDOS-BEGIN` / `// CREDOS-END`
- **Risk:** Low — паттерн копирует существующие credos-маркеры в этом же файле,
  аналогично `__credos_status`, `__credos_1c`, `__credos_company_status`
- **На merge upstream:** при рефакторинге Twenty файла проверить что блок
  «проверки `fieldMetadataId` до рендера empty state» ещё существует; если да —
  сохранить наш CREDOS-BEGIN/END. Если Twenty переписал Widget system — мигрировать

### 2026-04-24 — Record Open Mode Toggle (Dev Report #020)

Глобальный тумблер «Side Panel / Record Page» для workspace (админ) и пользователя (localStorage).
Маркеры в коде: `// CREDOS:` / `// CREDOS-BEGIN:` / `// CREDOS-END`.

- **File:** `packages/twenty-front/src/modules/object-record/record-index/hooks/useOpenRecordFromIndexView.ts`
- **Change:** +4 строки импортов, +11 строк в `useCallback` блок — вычисление
  `effectiveOpenRecordIn = resolveCredosOpenMode({userOverride, workspaceForce, viewDefault})`
  + замена переменной в условии выбора режима (SIDE_PANEL vs RECORD_PAGE)
- **Reason:** Единая точка применения приоритетов: user localStorage > workspace admin > view.openRecordIn
- **Risk:** Medium — ключевой хук для навигации из index views. При рефакторинге upstream
  (переименование / вынос логики) потребуется ручной мерж. Вся новая логика живёт в
  `credos/workspace-settings/utils/resolveCredosOpenMode.ts` — изменение в ядре минимально
- **На merge upstream:** сохранить CREDOS-блок, если переменная `recordIndexOpenRecordIn` в
  условии переименована — переименовать также `viewDefault` входной параметр resolver-а
- **Marker audit:** `grep -rn "CREDOS:" packages/ | grep -v credos/`

- **File:** `packages/twenty-front/src/modules/app/components/AppRouterProviders.tsx`
- **Change:** +2 строки — lazy import и монтирование `<CredosWorkspaceSettingsHydratorEffect />`
  в дереве после `<AuthProvider>` (до `<ApolloCoreProvider>`)
- **Reason:** Хидратация Jotai atoms workspace/user open mode при старте — без этого
  настройка админа не применится для обычных юзеров
- **Risk:** Low — одна точка монтирования в иерархии провайдеров

- **File:** `packages/twenty-shared/src/types/SettingsPath.ts`
- **Change:** +1 enum entry (`CredosProfile = 'credos-profile'`)
- **Reason:** Route для страницы "Мои настройки" (per-user override)
- **Risk:** Low

- **File:** `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- **Change:** +5 строк lazy import + +4 строки `<Route>` для `SettingsCredosProfile`
- **Reason:** Регистрация роута `/settings/credos/profile`
- **Risk:** Low — аналогично другим Credos-route

- **File:** `packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx`
- **Change:** +5 строк — пункт "Мои настройки" в секции "Кредо-С"
- **Reason:** Навигация в боковой панели Settings
- **Risk:** Low

### 2026-03-17 — Lead Collector Module: UI routing (Фаза 07)
- **File:** `packages/twenty-shared/src/types/SettingsPath.ts`
- **Change:** +1 enum entry (`CredosLeadCollector = 'credos-lead-collector'`)
- **Reason:** Route для страницы настроек сбора лидов
- **Risk:** Low — добавление enum value
- **File:** `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- **Change:** +8 строк (lazy import + Route для SettingsCredosLeadCollector)
- **Reason:** Регистрация route для страницы Settings → Кредо-С → Сбор лидов
- **Risk:** Low — аналогично CredosBeeline и CredosOneC

### 2026-03-17 — Lead Collector Module (Фаза 07)
- **File:** `packages/twenty-server/src/engine/core-modules/message-queue/message-queue.constants.ts`
- **Change:** +1 enum entry (`credosLeadCollectorQueue = 'credos-lead-collector-queue'`)
- **Reason:** Bull queue для async обработки email-лидов
- **Risk:** Low — добавление enum value
- **File:** `packages/twenty-server/src/engine/core-modules/message-queue/message-queue-priority.constant.ts`
- **Change:** +2 entries (credosDeliveryQueue + credosLeadCollectorQueue priority = 5)
- **Reason:** Приоритет для credos очередей (ранее credosDeliveryQueue не был в маппинге)
- **Risk:** Low — добавление записей в маппинг
- **Status (2026-04-24):** Enum `credosLeadCollectorQueue` больше не используется кодом
  после рефакторинга lead-collector на in-process cron (Dev Report #019). Константа
  оставлена в core-файле — её удаление не даёт пользы и создаёт merge conflict.

### 2026-04-24 — Lead Collector: откат к pure in-process (Dev Report #019)
Ранее (в этой же сессии, предыдущие коммиты) были добавлены ссылки на
`EmailPollCronCommand` в `database/commands/cron-register-all.command.ts` и
импорт `CredosLeadCollectorModule` в `database/commands/database-command.module.ts`.
Эти изменения **полностью откачены** коммитом `3d31f3234c`, так как модуль больше
не использует BullMQ worker cron — переключен на `@nestjs/schedule` in-process.
Жёлтая зона теперь чистая, никаких изменений за пределами `credos/` не требуется.

### 2026-03-17 — Интеграция 1С:УНФ (Волна 2: Settings page + Widget)
- **File:** `packages/twenty-shared/src/types/SettingsPath.ts`
- **Change:** +1 enum entry (`CredosOneC = 'credos-1c'`)
- **Reason:** Route для страницы настроек интеграции 1С:УНФ в Settings sidebar
- **Risk:** Low — добавление enum value, не затрагивает существующие routes
- **File:** `packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx`
- **Change:** +5 строк (item '1С:УНФ' в секции 'Кредо-С')
- **Reason:** Пункт навигации в Settings sidebar
- **Risk:** Low — добавление item в существующую секцию 'Кредо-С'
- **File:** `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- **Change:** +6 строк (lazy import + Route)
- **Reason:** Регистрация route для страницы Settings → Кредо-С → 1С:УНФ
- **Risk:** Low — аналогично CredosDictionaries и CredosSettings
- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:** +1 import (`CredosOneCWidget`), +1 const (`CREDOS_1C_MARKER`), +4 строки (if-ветка)
- **Reason:** Виджет интеграции 1С в карточке Company (показывает GUID, дату sync, ответственного)
- **Risk:** Low — добавление if-ветки по образцу CREDOS_COMPANY_STATUS_MARKER

### 2026-03-16 — Quick-filter dropdowns на стандартных list views
- **File:** `packages/twenty-front/src/modules/object-record/record-index/components/RecordIndexContainer.tsx`
- **Change:** +1 import (`CredosQuickFilterBar`), +1 строка рендера (`<CredosQuickFilterBar />`)
- **Lines:** 13, 67
- **Reason:** Панель быстрых фильтров (SELECT dropdowns + date presets + «Мои») над стандартными таблицами Twenty для credos-объектов
- **Risk:** Low — добавление одного компонента между `SpreadsheetImportProvider` и `RecordIndexFiltersToContextStoreEffect`. Компонент возвращает `null` для объектов без конфигурации.
- **Merge note:** При конфликте — добавить import и `<CredosQuickFilterBar />` перед `<RecordIndexFiltersToContextStoreEffect />`

### 2026-03-14 — Кнопка «Загрузить из ДаДата» на карточке Company
- **File:** `packages/twenty-front/src/modules/command-menu-item/contexts/CommandMenuContextProviderDefault.tsx`
- **Change:** +1 import (`useCredosDadataCommands`), +3 строки (вызов хука + spread в массив `commandMenuItems`)
- **Lines:** 9, 51-53, 65
- **Reason:** Регистрация кнопки DaData в Command Menu через существующий extension point
- **Risk:** Low — одна строка в массиве spread, аналогично `useRunWorkflowRecordCommands`
- **Merge note:** При конфликте — добавить import и spread обратно по образцу соседних хуков

### 2026-03-15 — Регистрация CredosModule в ModulesModule
- **File:** `packages/twenty-server/src/modules/modules.module.ts`
- **Change:** +1 import (`CredosModule`), +1 строка в imports array
- **Lines:** 9, 19
- **Reason:** Входная точка для всех бэкенд-модулей credos/ (DaData endpoint, будущие фазы)
- **Risk:** Low — одна строка в массиве imports, аналогично остальным модулям
- **Merge note:** При конфликте — добавить `import { CredosModule } from 'src/credos/credos.module'` и `CredosModule` в imports

### 2026-03-16 — Добавление вкладок КП, Пресейлы, Пилоты, Опросники на карточку Company
- **File:** `packages/twenty-front/src/credos/page-layout/constants/DefaultCredosCompanyRecordPageLayout.ts`
- **Change:** +4 новых вкладки (КП, Пресейлы, Пилоты, Опросники), исправлена вкладка Взаимодействия (fieldMetadataId: vzaimodeystviyaKredo → vzaimodeystviyaKompanii — прямая связь)
- **Reason:** Отображение связанных модулей прямо на карточке компании через обратные RELATION-поля
- **Relation fields на Company:** kp, preseyly, piloty, oprosniki, vzaimodeystviyaKompanii
- **Risk:** None — изменение только в credos/ namespace, не затрагивает ядро Twenty

### 2026-03-15 — Кастомный layout для Company (вкладки «Контакты с клиентами» + «Взаимодействия»)
- **File:** `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts`
- **Change:** +1 import (`DEFAULT_CREDOS_COMPANY_RECORD_PAGE_LAYOUT_ID`), Company маппинг → credos layout
- **Reason:** Подключение кастомного layout с вкладками «Контакты с клиентами» и «Взаимодействия» для Company
- **Risk:** Low — замена значения в маппинге, аналогично credosContact
- **File:** `packages/twenty-front/src/modules/page-layout/hooks/useBasePageLayout.ts`
- **Change:** +2 import, +1 case в switch, +1 строка в isDefaultLayoutId
- **Reason:** Регистрация Credos Company layout как дефолтного
- **Risk:** Low — добавление case по образцу credosContact

### 2026-03-15 — Табличный виджет для relation полей (layout='VIEW')
- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:** +1 import (`CredosFieldWidgetRelationTable`), +7 строк (ветка `layout === 'VIEW'`)
- **Reason:** Отображение связанных записей таблицей вместо карточек/бейджей
- **Risk:** Low — добавление новой ветки перед существующей `layout === 'CARD'`, не затрагивает другой функционал

### 2026-03-15 — Inline-кнопка DaData на поле ИНН (hover action)
- **File:** `packages/twenty-front/src/modules/object-record/record-field-list/anchored-portal/components/RecordFieldListCellHoveredPortalContent.tsx`
- **Change:** +1 import (`CredosDadataInlineAction`), +3 строки (условный рендер для `credosInn`)
- **Reason:** Кнопка «Загрузить из ДаДата» при наведении на поле ИНН — быстрый доступ без Command Menu
- **Risk:** Low — условный рендер дополнительного children в flex-контейнере, не затрагивает остальные поля
- **Merge note:** При конфликте — добавить import и блок `{fieldDefinition.metadata.fieldName === 'credosInn' && ...}` после `RecordInlineCellDisplayMode`

### 2026-03-15 — Очередь credosDeliveryQueue в MessageQueue enum
- **File:** `packages/twenty-server/src/engine/core-modules/message-queue/message-queue.constants.ts`
- **Change:** +1 значение в конец enum (`credosDeliveryQueue = 'credos-delivery-queue'`)
- **Reason:** BullMQ очередь для системы доставки отчётов (email, telegram, webhook)
- **Risk:** Low — добавление значения в конец enum, не затрагивает существующие очереди
- **Merge note:** При конфликте — добавить `credosDeliveryQueue = 'credos-delivery-queue'` в конец enum MessageQueue

### 2026-03-15 — Модуль настроек Кредо-С (Справочники + Настройки)
- **File:** `packages/twenty-shared/src/types/SettingsPath.ts`
- **Change:** +2 значения в enum (`CredosDictionaries`, `CredosSettings`)
- **Reason:** Маршруты для страниц настроек Кредо-С
- **Risk:** Low — добавление значений в конец enum
- **File:** `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- **Change:** +2 lazy import, +2 Route элемента
- **Reason:** Регистрация маршрутов страниц настроек Кредо-С
- **Risk:** Low — добавление маршрутов по аналогии с остальными
- **File:** `packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx`
- **Change:** +2 import (IconList, IconSettings2), +1 секция «Кредо-С» с 2 пунктами
- **Reason:** Навигация к страницам Справочников и Настроек Кредо-С
- **Risk:** Low — добавление секции между Workspace и Other
- **Merge note:** При конфликте — добавить секцию `Кредо-С` с двумя items перед секцией `Other`

### 2026-03-15 — Cron-команда ReportScheduler в CronRegisterAllCommand
- **File:** `packages/twenty-server/src/database/commands/cron-register-all.command.ts`
- **Change:** +1 import (`ReportSchedulerCronCommand`), +1 конструктор-параметр, +1 элемент в массив commands
- **Reason:** Регистрация cron-задачи планировщика подписок на отчёты
- **Risk:** Low — добавление элемента в конец массива commands, аналогично остальным cron-командам
- **Merge note:** При конфликте — добавить import, конструктор-параметр и элемент `{name: 'CredosReportScheduler', command: this.reportSchedulerCronCommand}` в массив

### 2026-03-15 — CredosDeliveryModule в DatabaseCommandModule
- **File:** `packages/twenty-server/src/database/commands/database-command.module.ts`
- **Change:** +1 import (`CredosDeliveryModule`), +1 строка в imports array
- **Reason:** Предоставление ReportSchedulerCronCommand для CronRegisterAllCommand
- **Risk:** Low — добавление модуля в конец массива imports
- **Merge note:** При конфликте — добавить `CredosDeliveryModule` в imports

### 2026-03-16 — Custom objects в Cmd+K навигации
- **File:** `packages/twenty-front/src/modules/command-menu-item/hooks/useRegisteredCommandMenuItems.ts`
- **Change:** +1 import (`useCredosCustomObjectNavigationCommands`), +1 хук вызов, +1 spread в commandMenuItemsConfig
- **Reason:** Динамическая генерация «Go to {label}» для всех active custom objects в Cmd+K
- **Risk:** Low — spread дополнительных команд в конец конфига, не затрагивает существующие
- **Merge note:** При конфликте — добавить import + вызов хука + spread `...credosCustomObjectNavigationCommands` в commandMenuItemsConfig

### 2026-03-16 — Кастомный layout credosActivity + статус-виджет credosContact
- **File:** `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts`
- **Change:** +1 import (`DEFAULT_CREDOS_ACTIVITY_RECORD_PAGE_LAYOUT_ID`), +1 строка маппинга `credosActivity`
- **Reason:** Подключение кастомного layout для карточки взаимодействия (2 вкладки: Главное + История)
- **Risk:** Low — добавление строки в маппинг, аналогично credosContact и credosQuote
- **Merge note:** При конфликте — добавить import и строку `credosActivity: DEFAULT_CREDOS_ACTIVITY_RECORD_PAGE_LAYOUT_ID`
- **File:** `packages/twenty-front/src/modules/page-layout/hooks/useBasePageLayout.ts`
- **Change:** +1 import (`DEFAULT_CREDOS_ACTIVITY_RECORD_PAGE_LAYOUT`), +1 case в switch, +1 строка в `isDefaultLayoutId`
- **Reason:** Регистрация Credos Activity layout как дефолтного
- **Risk:** Low — добавление case по образцу credosContact
- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:** +1 import (`CredosContactStatusWidget`), +1 константа `CREDOS_CONTACT_STATUS_MARKER = '__credos_status'`, +5 строк (ветка before CREDOS_COMPANY_ACTIVITIES_MARKER)
- **Reason:** Коллапсируемый виджет быстрого статуса (стадия, бизнес-направление, ответственный, бюджет, промежуточный результат) в верхней части вкладки «Главное» карточки credosContact
- **Risk:** Low — добавление новой ветки перед существующим блоком company activities, не затрагивает другой функционал
- **Merge note:** При конфликте — добавить import `CredosContactStatusWidget` и блок `if (fieldMetadataId === CREDOS_CONTACT_STATUS_MARKER) { return <CredosContactStatusWidget />; }` перед блоком `CREDOS_COMPANY_ACTIVITIES_MARKER`

### 2026-03-16 — Кастомный layout Person + статус-виджет Company + фильтры на все вкладки
- **File:** `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts`
- **Change:** +1 import (`DEFAULT_CREDOS_PERSON_RECORD_PAGE_LAYOUT_ID`), Person маппинг → credos layout
- **Reason:** Подключение кастомного layout для Person с вкладками: Контакты с клиентами, Взаимодействия, Лиды
- **Risk:** Low — замена значения в маппинге
- **File:** `packages/twenty-front/src/modules/page-layout/hooks/useBasePageLayout.ts`
- **Change:** +2 import (Person layout + ID), +1 case в switch, +1 строка в isDefaultLayoutId
- **Reason:** Регистрация Credos Person layout как дефолтного
- **Risk:** Low — добавление case по образцу остальных credos layouts
- **File:** `packages/twenty-front/src/modules/page-layout/widgets/field/components/FieldWidget.tsx`
- **Change:** +1 import (`CredosCompanyStatusWidget`), +1 константа `CREDOS_COMPANY_STATUS_MARKER = '__credos_company_status'`, +4 строки (ветка after CREDOS_CONTACT_STATUS_MARKER)
- **Reason:** Коллапсируемый виджет статуса компании (credosOverallStatus, credosSegment, credosRegion, accountOwner) в верхней части вкладки «Главное» карточки Company
- **Risk:** Low — добавление новой ветки после аналогичного блока credosContact
- **Merge note:** При конфликте — добавить import `CredosCompanyStatusWidget` и блок `if (fieldMetadataId === CREDOS_COMPANY_STATUS_MARKER) { return <CredosCompanyStatusWidget />; }` после блока `CREDOS_CONTACT_STATUS_MARKER`

### 2026-03-16 — Добавление переводов в backend i18n PO файлы
- **Files:** `packages/twenty-server/src/engine/core-modules/i18n/locales/en.po`
           `packages/twenty-server/src/engine/core-modules/i18n/locales/ru-RU.po`
           `packages/twenty-server/src/engine/core-modules/i18n/locales/generated/*.ts`
- **Change:** +3 записи в en.po и ru-RU.po для строк из flat-field-metadata системы:
  "Updated by" → "Кем обновлено", "Avatar File" → "Файл аватара", "Owner" → "Ответственный"
- **Reason:** Эти строки используют plain `label: '...'` (не `msg\`...\`` макрос Lingui),
  поэтому не попадают в PO при `lingui:extract`. Добавлены вручную.
- **Risk:** Low — добавление новых записей в конец PO файлов, не затрагивает существующие переводы
- **Merge note:** При конфликте — добавить три записи (Updated by, Avatar File, Owner) в конец
  en.po и ru-RU.po, затем запустить `npx nx run twenty-server:lingui:compile`

### 2026-03-16 — Модуль отчётности: роут + навигация
- **File:** `packages/twenty-shared/src/types/AppPath.ts`
- **Change:** +1 строка `CredosReports = '/credos/reports'`
- **Risk:** Low — добавление enum member
- **File:** `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- **Change:** +1 lazy import (CredosReportsPage), +1 Route
- **Risk:** Low — по паттерну CredosDashboard
- **File:** `packages/twenty-front/src/modules/navigation/components/CredosNavigationDrawerSection.tsx`
- **Change:** +1 import (IconPresentation), +1 NavigationDrawerItem "Отчёты"
- **Risk:** Low — по паттерну "Дашборд"
- **Merge note:** При конфликте — добавить CredosReports в AppPath, lazy import + Route в роутер, пункт навигации в drawer

### 2026-04-25 — AI Summary tab: dispatcher + Opportunity layout
- **File:** `packages/twenty-front/src/modules/page-layout/widgets/components/WidgetContentRenderer.tsx`
- **Change:** +1 import (`renderCredosCustomWidget`), +3 строки перед switch — раннее перенаправление credos-виджетов
- **Reason:** Diспетчер для credos-кастомных виджетов (сейчас `ai-summary`, в будущем — другие). Хитро использует существующий `WidgetType.IFRAME` с url-префиксом `credos://<kind>` чтобы не вводить новый WidgetType (избегаем правок GraphQL-схемы).
- **Risk:** Low — добавление кода ДО switch, никакая стандартная ветка не меняется
- **Merge note:** При конфликте — добавить import `renderCredosCustomWidget` и блок `const credosNode = renderCredosCustomWidget(widget); if (credosNode !== null) return credosNode;` в начало функции `WidgetContentRenderer`

- **File:** `packages/twenty-front/src/modules/page-layout/utils/getDefaultRecordPageLayoutId.ts`
- **Change:** Замена импорта `DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID` → `DEFAULT_CREDOS_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID`, обновлён маппинг `Opportunity`
- **Reason:** Подключение credos-layout для Opportunity (наследует все Twenty-вкладки + AI Резюме)
- **Risk:** Low — замена значения в маппинге

- **File:** `packages/twenty-front/src/modules/page-layout/hooks/useBasePageLayout.ts`
- **Change:** +2 import, +1 case в switch (после `DEFAULT_OPPORTUNITY_...` case), +1 строка в `isDefaultLayoutId`
- **Reason:** Регистрация Credos Opportunity layout как дефолтного
- **Risk:** Low — по образцу остальных credos layouts

- **File:** `packages/twenty-front/src/modules/page-layout/utils/__tests__/getDefaultRecordPageLayoutId.test.ts`
- **Change:** Импорт + ожидаемый ID в тесте Opportunity
- **Reason:** Тест должен соответствовать обновлённому маппингу
- **Risk:** Low — обновление теста

---

## 2026-04-27 — Enterprise gate unlock для self-hosted (CREDOS-маркеры)

### `packages/twenty-server/src/engine/core-modules/workspace/workspace.resolver.ts:315/325/335`

- **File:** `packages/twenty-server/src/engine/core-modules/workspace/workspace.resolver.ts`
- **Change:** 3 однострочных `// CREDOS: unlock enterprise features for self-hosted (billing disabled)` маркера в трёх ResolveField (`hasValidEnterpriseKey`, `hasValidSignedEnterpriseKey`, `hasValidEnterpriseValidityToken`)
- **Reason:** Bypass enterprise key check когда `IS_BILLING_ENABLED=false` — мы self-hosted, лицензия не требуется
- **Risk:** Low — гард только при выключенном биллинге
- **Audit:** `grep -n "// CREDOS:" packages/twenty-server/src/engine/core-modules/workspace/workspace.resolver.ts` → 3 матча
- **Note:** маркеры были `// credos:` lowercase, переформатированы в UPPERCASE по правилу `.claude/rules/twenty-customization.md` (catch QA audit 2026-04-27)

---

## 2026-05-18 — REVERTED: credos-mail-ca.pem + NODE_EXTRA_CA_CERTS (SOCKS5 IMAP больше не нужен)

### `packages/twenty-docker/twenty/Dockerfile` — отменено

- **Change:** убраны 2 строки `COPY ./credos/secrets/credos-mail-ca.pem ...` + `ENV NODE_EXTRA_CA_CERTS=...` и сопровождающие комментарии. Файл `credos/secrets/credos-mail-ca.pem` удалён. Папка `credos/secrets/` удалена.
- **Reason:** Lead Collector переведён с corp Exchange `mail04.credos.ru` (где IMAP оказался отключён admin'ом — см. blocker `#LEAD-PROXY-AUTH`) на публичный Timeweb-ящик `crm@cyberosnova.ru` @ `imap.timeweb.ru:993`. Timeweb использует стандартный GlobalSign DV TLS CA 2020 (system trust hits) — собственный CA в trust store больше не нужен. Также не нужен SOCKS5-туннель (Timeweb публично доступен с любого egress IP).
- **Risk:** None — возвращаемся к стандартному поведению Node.js TLS. `imap-client.service.ts` сохраняет conditional `proxy: process.env.CREDOS_RU_PROXY_SOCKS5` — backward-compat если когда-то понадобится снова (например, переезд на другой internal Exchange). Railway env `CREDOS_RU_PROXY_SOCKS5` удалена через API.
- **Note:** SOCKS5 endpoint `proxy.cyberosnova.ru:47080` на VM `158.160.169.13` остаётся работать (dormant) — нашими сервисами не используется. Допустимо оставить для будущих integrations или снести с VM (DevOps decision).
- **Audit:** `grep -n "# CREDOS:" packages/twenty-docker/twenty/Dockerfile` → 1 матч (только ffmpeg).

---

## 2026-04-27 — ffmpeg в Docker image для STT-стерео-сплита

### `packages/twenty-docker/twenty/Dockerfile:62`

- **File:** `packages/twenty-docker/twenty/Dockerfile`
- **Change:** добавлен `RUN apk add --no-cache ffmpeg` после установки postgresql-client (final-stage image)
- **Reason:** `credos/ai/stt/shared/ffmpeg-split.ts` требует CLI-бинарь `ffmpeg` для split'а stereo audio Beeline на L/R каналы. Без него `splitStereoToMono` возвращает `null`, `OpenAiWhisperProvider.transcribeStereo` идёт в fallback на mono — все сегменты помечаются `'manager'` (наблюдалось в UI: транскрипты диалога с клиентом показывали 9/9 строк как «Менеджер»).
- **Risk:** Low — добавление пакета в alpine; ffmpeg-static binary ~80 MB но не критично для Railway image size; нет влияния на upstream-код.
- **Note:** при следующем merge upstream — проверить, не вынес ли twenty в свой Dockerfile собственный ffmpeg (тогда наш RUN можно удалить).

---

## 2026-04-27 — SettingsPath.CredosReports — путь /settings/credos-reports

### `packages/twenty-shared/src/types/SettingsPath.ts:72`

- **File:** `packages/twenty-shared/src/types/SettingsPath.ts`
- **Change:** добавлен enum value `CredosReports = 'credos-reports'` с inline `// CREDOS:` маркером
- **Reason:** Settings UI page `/settings/credos-reports` (Wave 7 #REP2-9 — каталог отчётов + подписки + доставка)
- **Risk:** Low — расширение enum, существующие значения не тронуты
- **Audit:** `grep -n "// CREDOS:" packages/twenty-shared/src/types/SettingsPath.ts` → 2 матча (CredosReports + CredosProfile)

---

## 2026-04-27 — RISK-016 request-id middleware в main.ts (yellow zone)

### `packages/twenty-server/src/main.ts:75-92`

- **File:** `packages/twenty-server/src/main.ts`
- **Change:** добавлен middleware который читает `x-railway-request-id` из request headers, генерирует fallback `local-<ts>-<rnd>` если отсутствует, эхо'ит в response header `x-request-id` и кладёт в `res.locals.requestId` для использования log middleware
- **Reason:** RISK-016 (CISO Audit-7) — корреляция Railway proxy logs ↔ app logs невозможна без propagation request-id. Поддержка на support-инцидентах: customer берёт request-id из browser DevTools и передаёт ops для grep по логам
- **Risk:** Low — pure middleware без side-effects кроме header set + locals attach; не меняет existing behavior
- **Audit:** `grep -n "// CREDOS:" packages/twenty-server/src/main.ts` → 5 матчей (RISK-011/012/013 helmet+disable + RISK-016 request-id)
- **Markers:** CREDOS-BEGIN/END блок на строках 75-92 + inline comment на import

---

## 2026-06-15 — #ONEC-DEBUG raw body parser в main.ts (yellow zone)

### `packages/twenty-server/src/main.ts:107-108`

- **File:** `packages/twenty-server/src/main.ts`
- **Change:** `app.use('/rest/credos/oneC/debug', express.text({ type: '*/*', limit }))` зарегистрирован ПЕРЕД `app.useBodyParser('json')`. Path-specific text-parser потребляет body как строку для `/debug`, ставит `req._body=true` → глобальный json-parser пропускает этот путь
- **Reason:** debug-endpoint для диагностики 1С должен принимать ЛЮБОЕ тело (включая невалидный JSON) и возвращать 200 + эхо, а не 400 от json body-parser. Контроллер парсит строку сам в try/catch (`credos-onec.controller.ts` debugCapture)
- **Risk:** Low — затрагивает ТОЛЬКО путь `/rest/credos/oneC/debug`; остальные маршруты на глобальном json-parser без изменений. Временный debug-endpoint, удалить после диагностики 1С
- **Audit:** `grep -n "// CREDOS:" packages/twenty-server/src/main.ts`
- **Markers:** inline `// CREDOS: debug endpoint — raw body capture, invalid JSON returns 200 not 400`
