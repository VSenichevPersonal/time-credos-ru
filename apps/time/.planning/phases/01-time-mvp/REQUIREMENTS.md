# REQUIREMENTS — модуль time, фаза 01 (MVP)

**Дата:** 2026-06-20
**Продукт:** time.credos.ru — внутренний учёт трудозатрат Кредо-С, Twenty SDK-app.
**Опоры:** `docs/data-model/DATA_MODEL_SYNTHESIS.md`, `docs/data-model/CAPACITY_PLANNING.md`, `docs/data-model/SEED_DATA_PLAN.md`, `docs/standards/DEV_STANDARDS.md`, `research/twenty-sdk/` (SDK-факты + сверка).
**Нейминг:** объекты с префиксом `tt` (во избежание коллизий с CRM). Все labels/справочники — русские.

---

## v1 — в скоупе (MVP)

### SETUP — каркас приложения
- **SETUP-01** Скаффолд SDK-app в `apps/time/` (`create-twenty-app`), Node 24/Yarn 4, структура объект/вью/front/logic/role.
- **SETUP-02** `defineApplication` (universalIdentifier, displayName «Трудозатраты», описание), `engines.twenty` (целевая 2.x), дисциплина версий.
- **SETUP-03** SSOT: `constants.ts` (категории, статусы, группы видов работ, ярлыки рус.) + `types.ts` (string-literal union).
- **SETUP-04** Локальная дев-среда: локальный Twenty 2.x в Docker + `yarn twenty dev` (документировать запуск).

### DATA — модель данных (defineObject)
- **DATA-01** `ttDepartment` (code, name рус., approvalRequired, capacityFactor, headcount). 5 значений (ОВ/ОИБ/ОПИБ/ТЦ/ОПР).
- **DATA-02** `ttEmployee` (firstName/lastName/middleName, email, →department, position, active). Маппинг на пользователя workspace (поле-ссылка). Employee — кастомный объект (в Twenty нет встроенного).
- **DATA-03** `ttProject` (code, name, →company [стандартный Company], →department, →manager [ttEmployee], category, billable, status, startDate, endDate, plannedHours, approvalRequired nullable, serviceRef nullable). Развитая сущность + карточка.
- **DATA-04** `ttStage` (→project, code, name, status, startDate, endDate, plannedHours).
- **DATA-05** `ttActivity` (name рус., group [string-literal: производственная/управление-проектом/пресейл/совещания/обучение/внутренние], →department nullable [global], billableByDefault).
- **DATA-06** `ttTimeEntry` (date, hours [NUMBER decimal], description, →employee, →project, →stage nullable, →activity nullable, billable, status). Атом учёта.
- **DATA-07** `ttBillingLink` (→project, externalSystem='1С', docType [Order/Payment/Act], externalId, number, date, amount). M:N структура, синхронизация позже.
- **DATA-08** Связи (RELATION MANY_TO_ONE/ONE_TO_MANY) и индексы (uniq где нужно: code, date+employee).

### L10N — локализация
- **L10N-01** Все labels объектов/полей — русские. Категории/статусы/группы — русские ярлыки (код латиницей, SSOT-маппинг).
- **L10N-02** Русская локаль дат/дней недели в front-компонентах.

### NAV — навигация и доступ
- **NAV-01** Раздел-папка «Трудозатраты» в сайдбаре (`defineNavigationMenuItem` FOLDER) с пунктами: Мой таймшит, Проекты, Согласование, Планирование, Справочники.
- **NAV-02** Дефолтные `defineView` (ViewKey.INDEX) для каждого видимого объекта (Project, TimeEntry, Activity…) — иначе невидимы.
- **NAV-03** Роли: одна `defineApplicationRole` (сотрудник) + `defineRole` (руководитель/админ): права на объекты/поля.

### SEED — сид-данные (янв–июнь 2026)
- **SEED-01** Справочники: 5 отделов + виды работ (Activity) с группами (ОВ из Директум5, ИБ/ТЦ из каталога услуг, ОПР задать).
- **SEED-02** Импорт реальных ОВ: 3501 запись янв–июнь 2026 (очистка аномалий: часы>24, дата 2055; nullable пустые). Маппинг работников на ttEmployee, орг на Company, категории по орг/проекту.
- **SEED-03** Генерация мок-данных ОИБ/ОПИБ/ТЦ/ОПР за тот же период ПО ОБРАЗЦУ модели ОВ (детерминированно, без Math.random в app).
- **SEED-04** Механизм: `definePostInstallLogicFunction` + возможность ручного `dev:function:exec`.

### GRID — недельная сетка
- **GRID-01** Front-компонент недельной сетки (строки=проект/вид работ × дни недели, итоги, план/факт). Русская локаль.
- **GRID-02** Ввод/редактирование часов (Decimal, шаг 0.5) инлайн; описание (Состав работ).
- **GRID-03** Сохранение через `/s/`-route logic-функцию (front в песочнице — не прямой доступ к БД).
- **GRID-04** Навигация по неделям, переключение сотрудника (для руководителя).

### TIMER — таймер
- **TIMER-01** Front-таймер start/stop с привязкой к проекту/виду работ; по стопу — создаёт `ttTimeEntry` (через `/s/`-route).

### CAPACITY — планирование загрузки
- **CAPACITY-01** Front-доска «Планирование»: отделы × недели/месяцы вперёд, загрузка % (ёмкость = headcount×норма×capacityFactor; план = plannedHours проектов по неделям).
- **CAPACITY-02** Цветовая индикация загрузки; клик по отделу → проекты, формирующие загрузку.

### APPROVAL — согласование (отключаемое)
- **APPROVAL-01** Статус записи/периода (Черновик/На согласовании/Согласовано/Отклонено) — применяется если `Project.approvalRequired ?? Department.approvalRequired`.
- **APPROVAL-02** Кнопки отправить/согласовать/отклонить → `/s/`-route logic-функция (`isAuthRequired`, фиксирует кто и когда).

### INSTALL — проверка установки
- **INSTALL-01** PoC: `dev:build` → `app:publish --private` → `app:install` в dev-workspace (после готовности локального Twenty 2.x). Checkpoint human-verify.

---

## v2 — отложено

- **V2-ANALYTICS** Дашборды утилизации (часы по категории × группа × отдел × период), отчёты.
- **V2-SERVICE** Связь с каталогом услуг (Service как общий объект, estimatedDuration → план). См. ADR-0003.
- **V2-RATES** Ставки 4 уровня + инвойсинг (Kimai-логика).
- **V2-1C** Наполнение `ttBillingLink` из 1С (оплаты/акты) → рентабельность проекта.
- **V2-SBIS** СБИС-рельса продукт-селектора (жёлтая зона, отдельный core-PR в форк).
- **V2-LIFECYCLE** State-machines статусов (Timetta) вместо простых enum.

---

## Вне скоупа
- Ресурс-планирование по конкретным людям (только по отделам).
- Диаграмма Ганта, зависимости задач.
- Мульти-workspace распространение (Enterprise-шеринг).
- Перенос истории Директум 5 старше янв-2026.
