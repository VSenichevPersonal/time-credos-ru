# Каталог услуг (Knowledge Hub) — проектирование

Проектные документы **каталога услуг** как отдельного SDK-app.
Каталог — НЕ часть time-приложения (разные домены), но на той же платформе Twenty с общими мастер-данными. Размещение — контур CRM (первичный пользователь — отдел продаж).
Исходники прототипа — в `../../research/credos-it-catalog/`. Код (позже) — в `../../apps/catalog/`.

## Документы
| Файл | Что |
|---|---|
| `RECON.md` | разбор прототипа CredosITCatalog: полная модель данных, что забираем |
| `SDK_DESIGN.md` | проект каталога как SDK-app: маппинг на defineObject, интеграции, порядок |
| `OSS_REFERENCES.md` | разбор 3 OSS-референсов (Backstage/CASS/NocoBase) + синтез под нас: главный приём — компетенции с уровнем+сроком+requires (gap-светофор «что можем продавать») |
| `IMPLEMENTATION_PLAN.md` | план реализации на Twenty SDK: фазы/волны по стандартам, cross-app (ADR-0009), услуга как разрез time (проект/план/бронь↔услуга), MVP=Phase 0+1+2 |
| `../../research/credos-it-catalog/` | копии исходных проектных доков прототипа (VISION, DATA_MODEL, SCOPE, ARCHITECTURE, UI_COMPONENTS, TECH_STACK) — референс |

## Ключевое
- **Решение:** `../adr/0003-catalog-separate-app-shared-master-data.md`
- **Service** — мост: каталог владеет, time и продажи (CRM/КП) ссылаются.
- **Общие мастер-данные:** Department, Employee, Service — определяются один раз в Twenty.
- **Порядок:** сначала time-app, каталог — следующей итерацией.

## Источник прототипа
`/Users/vsenichev/Documents/GitHub/CredosITCatalog` (Next.js+Prisma, Pre-MVP). Стек не переносим — модель как референс, код под Twenty SDK.
