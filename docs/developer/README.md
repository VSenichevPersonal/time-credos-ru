# Developer Guide — time-credos-ru

Руководство разработчика для системы учёта трудозатрат Кредо-С.
Платформа: **Twenty CRM SDK v2.14**. Язык: **TypeScript**.
Репо изолировано от форка CredosCRM1 (ADR-0002).

---

## Содержание

| Файл | Тема |
|------|------|
| [01-architecture.md](01-architecture.md) | Архитектура, C4-диаграмма, ADR, зоны Dev1/Dev2 |
| [02-data-model.md](02-data-model.md) | Объекты, поля, ERD, статусы, derived-stored поля |
| [03-adding-feature.md](03-adding-feature.md) | Пошаговый tutorial: добавить поле + API-роут |
| [04-security.md](04-security.md) | CISO-находки, паттерны защиты, правила |

Дополнительный контекст:

- `docs/standards/DEV_STANDARDS.md` — стандарты кода (размеры файлов, нейминг, зоны)
- `docs/adr/` — архитектурные решения ADR-0001..0007
- `docs/security/RISK_REGISTER.md` — реестр CISO-рисков
- `docs/requirements/` — требования REQ-*

---

## Быстрый старт для нового разработчика

### 1. Клонировать и установить зависимости

```bash
git clone <repo-url> time-credos-ru
cd time-credos-ru
yarn install
```

### 2. Настроить `.env`

Скопировать `.env.example`, заполнить:

```bash
cp .env.example .env
# Заполнить TWENTY_API_URL и TWENTY_APP_ACCESS_TOKEN
# Реальные значения — у архитектора или в Railway Secrets
```

> **Note:** `.env` и любые файлы с реальными данными — никогда не коммитить.
> Смотри `.gitignore` секцию «ПДн» и правила CISO-001/CISO-009.

### 3. Прочитать обязательно перед кодом

1. `docs/developer/01-architecture.md` — зоны Dev1/Dev2 и слои SDK
2. `docs/standards/DEV_STANDARDS.md` — нейминг, лимиты файлов, правило SSOT
3. `docs/security/RISK_REGISTER.md` — открытые CISO-находки (что нельзя нарушать)

### 4. Запустить dry-run (убедиться что схема валидна)

```bash
cd apps/time
yarn twenty dev --once --dry-run
```

Нулевые ошибки = схема читается SDK без проблем.

### 5. Создать первую сущность через scaffolding

```bash
yarn twenty dev:add object       # → src/objects/<name>.object.ts
yarn twenty dev:add logicFunction # → src/logic-functions/<name>.logic.ts
yarn twenty dev:add frontComponent # → src/front-components/<name>.front-component.tsx
```

Детальный workflow — в [03-adding-feature.md](03-adding-feature.md).

---

## Принципы

### Минимальное решение

Не добавляй то, что не нужно для текущего требования. Derived-поля — только если они необходимы для native views SDK (stored). Всё остальное считай на лету.

### Без gold-plating

Каждая абстракция должна закрывать конкретный REQ. Перед реализацией сверь с Timetta/Kimai: такое уже есть в референсе?

### Файлы < 200 строк

Компоненты < 150 строк, хуки < 100. Превышение = сигнал к декомпозиции. Обратные поля (ONE_TO_MANY) объектов выносятся в `src/fields/`.

### UUID через SSOT

Все UUID — только через `src/constants/universal-identifiers.ts`. Никакого inline-хардкода UUID в объектах/views/layouts.

### Зоны Dev1 / Dev2

Dev1 = фронт (`front-components/`, `views/`, `page-layouts/`, `navigation-menu-items/`).
Dev2 = бэкенд (`objects/`, `fields/`, `logic-functions/`, `scripts/`).
Не писать в зону другого без согласования с архитектором.
