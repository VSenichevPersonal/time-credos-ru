# Catalog SDK — каталог услуг (Knowledge Hub)

Подпапка для всего, что связано с **каталогом услуг** как отдельным SDK-app.
Каталог — НЕ часть time-приложения (разные домены), но на той же платформе Twenty с общими мастер-данными. Размещение — контур CRM (первичный пользователь — отдел продаж).

## Документы
| Файл | Что |
|---|---|
| `RECON.md` | разбор прототипа CredosITCatalog: полная модель данных, что забираем |
| `SDK_DESIGN.md` | проект каталога как SDK-app: маппинг на defineObject, интеграции, порядок |
| `source-docs-CredosITCatalog/` | копии исходных проектных доков прототипа (VISION, DATA_MODEL, SCOPE, ARCHITECTURE, UI_COMPONENTS, TECH_STACK) — референс |

## Ключевое
- **Решение:** `../docs/adr/0003-catalog-separate-app-shared-master-data.md`
- **Service** — мост: каталог владеет, time и продажи (CRM/КП) ссылаются.
- **Общие мастер-данные:** Department, Employee, Service — определяются один раз в Twenty.
- **Порядок:** сначала time-app, каталог — следующей итерацией.

## Источник прототипа
`/Users/vsenichev/Documents/GitHub/CredosITCatalog` (Next.js+Prisma, Pre-MVP). Стек не переносим — модель как референс, код под Twenty SDK.
