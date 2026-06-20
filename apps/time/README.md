# apps/time — SDK-приложение учёта трудозатрат

Корень **time-app** — Twenty SDK-приложение (учёт времени, проекты, планирование загрузки).
Здесь живёт код модуля. Скаффолд — `npx create-twenty-app` (см. `../../docs/architecture/DEV_WORKFLOW.md`).

## Что внутри (по мере разработки)
```
apps/time/
├── (манифест defineApplication)
├── objects/        — defineObject: Department, Employee, Project, Stage,
│                     Activity, TimeEntry, BillingLink
├── views/          — defineView
├── page-layouts/   — карточки (Project и др.)
├── front/          — defineFrontComponent: недельная сетка, таймер, планёрка загрузки
├── logic/          — defineLogicFunction: approval, расчёты, сид
└── roles/          — defineRole
```

## Опорные документы
- Модель данных: `../../docs/data-model/DATA_MODEL_SYNTHESIS.md`
- Планирование загрузки: `../../docs/data-model/CAPACITY_PLANNING.md`
- Сид-данные: `../../docs/data-model/SEED_DATA_PLAN.md`
- Как разрабатываем/ставим: `../../docs/architecture/DEV_WORKFLOW.md`
- Решение: `../../docs/adr/0002-sdk-app-isolated-repo.md`

## Правила
- Справочники и UX/UI — **на русском** (коды enum — латиницей, ярлыки русские). См. синтез §7a.
- Разработка здесь; в Twenty — **установка** собранного app, не merge.
