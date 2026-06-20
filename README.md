# time.credos.ru — учёт трудозатрат Кредо-С

**Внутренний инструмент** учёта проектов, времени и планирования загрузки для Кредо-С.
Реализуется как **Twenty SDK-приложение** (устанавливается в CRM-платформу CredosCRM1).

---

## Структура репозитория

```
time-credos-ru/
├── README.md                ← этот файл (навигация)
│
├── apps/                    ← КОД SDK-приложений
│   ├── time/                  time-app: учёт времени, проекты, планёрка (пишем сейчас)
│   └── catalog/               catalog-app: каталог услуг (задел, после time)
│
├── docs/                    ← РЕШЕНИЯ и СПЕЦИФИКАЦИИ
│   ├── adr/                   архитектурные решения (0001–0003)
│   ├── architecture/          ARCHITECTURE_QA, DEV_WORKFLOW
│   ├── data-model/            модель данных, аудит, сид, планирование загрузки
│   └── catalog/               проектирование каталога услуг (RECON, SDK_DESIGN)
│
└── research/                ← РАЗВЕДКА (источники)
    ├── timetta/               Timetta (целевая модель PSA)
    ├── kimai/                 Kimai (логика трекинга, open-source)
    ├── directum5/             реальные трудозатраты + каталог услуг + Битрикс
    └── credos-it-catalog/     прототип каталога услуг (исходные доки)
```

Три слоя: **research** (что узнали) → **docs** (что решили и спроектировали) → **apps** (что пишем).

---

## Текущие решения (ADR)

| ADR | Решение |
|---|---|
| [0001](docs/adr/0001-platform-and-data.md) | Платформа — Twenty CRM; данные внутри платформы; auth через центральный IdP. time.credos.ru — **внутренний инструмент** |
| [0002](docs/adr/0002-sdk-app-isolated-repo.md) | time tracking — **SDK-app** в изолированном репо (этот); установка в workspace, не merge; старое не мигрируем |
| [0003](docs/adr/0003-catalog-separate-app-shared-master-data.md) | Каталог услуг — **отдельный SDK-app** в контуре CRM; общие мастер-данные (Department/Employee/Service); Service — мост |

---

## Карта документов

### Архитектура и процесс
| Документ | О чём |
|---|---|
| [docs/architecture/ARCHITECTURE_QA.md](docs/architecture/ARCHITECTURE_QA.md) | 8 вопросов с разборами (платформа, SDK, репо, auth) |
| [docs/architecture/DEV_WORKFLOW.md](docs/architecture/DEV_WORKFLOW.md) | как разрабатываем SDK-пакет и ставим в Twenty |

### Модель данных
| Документ | О чём |
|---|---|
| [docs/data-model/DATA_MODEL_SYNTHESIS.md](docs/data-model/DATA_MODEL_SYNTHESIS.md) | **главный** — единая модель, методология Директум5↔Kimai↔Timetta, локализация |
| [docs/data-model/DATA_INTEGRITY_AUDIT.md](docs/data-model/DATA_INTEGRITY_AUDIT.md) | аудит целостности источников (сверка 11/11) |
| [docs/data-model/SEED_DATA_PLAN.md](docs/data-model/SEED_DATA_PLAN.md) | сид-данные: реальные ОВ + мок (янв–июнь 2026) |
| [docs/data-model/CAPACITY_PLANNING.md](docs/data-model/CAPACITY_PLANNING.md) | планирование загрузки отделов |

### Каталог услуг
| Документ | О чём |
|---|---|
| [docs/catalog/SDK_DESIGN.md](docs/catalog/SDK_DESIGN.md) | каталог как SDK-app |
| [docs/catalog/RECON.md](docs/catalog/RECON.md) | разбор прототипа CredosITCatalog |

### Разведка (research)
| Источник | Ключевое |
|---|---|
| [research/directum5/RECON.md](research/directum5/RECON.md) | реальные трудозатраты (34k записей), каталог услуг 4 отделов |
| [research/directum5/bitrix-users/roster.csv](research/directum5/bitrix-users/roster.csv) | реестр сотрудников (72 чел, оргструктура) |
| [research/timetta/](research/timetta/) | целевая модель PSA (схема БД, lifecycles) |
| [research/kimai/](research/kimai/) | логика трекинга (Customer→Project→Activity→Timesheet) |

---

## Источники модели

| Система | Роль |
|---|---|
| **Директум 5** (реальная выгрузка) | фактическая модель трудозатрат + цель миграции |
| **Kimai** (open-source AGPL) | референс логики трекинга (переписываем, не копируем) |
| **Timetta** (РФ PSA) | целевая глубина (недельная сетка, Decimal-часы) |
| **Twenty CRM** (форк CredosCRM1) | платформа: SDK, RBAC, аудит, общие данные |

---

## Связанные репозитории

| Репозиторий | Назначение |
|---|---|
| [CredosCRM1](https://github.com/VSenichevPersonal/CredosCRM1) | Twenty-форк — платформа, куда ставится time-app |
| CredosITCatalog | прототип каталога услуг (Next.js+Prisma) — референс модели |
