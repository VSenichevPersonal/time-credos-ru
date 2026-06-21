# SESSION HANDOFF — time.credos.ru (2026-06-22)

## Состояние прода
- **HEAD = `cdccb9a`** (запушено origin/main). Прод `twenty-production-e5c5.up.railway.app`, app «Credos Time».
- Тестов: 1924 passed, 0 failed. Деплой: `cd apps/time; set -a; source ../../.env; set +a; yarn twenty dev --once` → ждать «✓ Synced».

## Что в проде (всё работает)
Учёт (таймшит 3 режима · вид-работ колонкой · меню строки ⋯ · чип-норма · lock-approved · валидация warn/error · теги · 8×5) · Планирование (план/без-проекта/мульти-отдел · Booking soft-hard · Resource Gap · перегруз ОВ 119% · метрики) · Отчёты (Сводка · Тренд · OLAP-drill+крошки+пилюли · KPI-по-скоупу · Проекты-план/факт · Незаполненные · Табель-Т13 · CSV-экспорт) · Согласование (submit · pre-submit-недобор · approve/batch · reject+причина · SoD · акт) · Личный кабинет (мои часы/периоды · баннер · reject-причина видна) · Структура отделов (head+иерархия) · Booking проект|компания(пресейл) · Настройки 15-парам singleton · Сайдбар 5 групп (Ввод времени/Планирование/Отчёты/Справочники/Настройки) · Целостность (факт-триггеры · UNIQUE-дедуп · lock-approved сервер+UI · ПДн КОД при reveal=false) · seed util 91% (60 проектов, 9 DONE, перебюджетные, ~5554 записей).

## QA
103 UC код-ревью: ✅80 ⚠17 ❌0 🔲5. E2E браузер MCP: клик→ввод работает, JS-ошибок нет; клавиатура-в-Web-Worker-sandbox через MCP не доходит (ограничение теста).

## В РАБОТЕ (фон, на момент хэндоффа)
4 аналитика генерят вопросы по UI/контролам → `docs/analysis/UI_QUESTIONS_{A,B,C,D}.md` (16 разделов × 20-30 вопросов). Волна-1. После → свести в `UI_QUESTIONS_INDEX.md` + SIGNALS + чат. Готов `docs/analysis/TIMESHEET_CELL_CONTROLS.md` (корневой разбор 3 симптомов + 28 вопросов + рекомендация C1: клик=ввод, контролы в меню ⋯, bulk-fill=2 явных действия по норме календаря).

## АКТИВНЫЙ UX-ТРЕК (требует ответов заказчика)
Заказчик просит **10-20+ серий по 20-30 вопросов** про все контролы/разделы → собрать требования → ТЗ на переделку контролов ячеек таймшита (корень: клик мгновенно входит в ввод → hover-кнопки чип-«8»/⇥/✎ исчезают до нажатия → мышью недостижимы; ячейки мелкие 58×32; bulk-fill неоднозначен на 2+ строк). Волна-2 (ещё ~16 серий: микро-взаимодействия/motion/onboarding/горячие-клавиши/плотность/тема/undo/уведомления/...) — после волны-1.

## ОТЛОЖЕНО (только по go-ahead заказчика)
- Финансы E1 (cost-rate→P&L) — крупный трек. БЕЗ bill-rate ([[no-billable-concept]]).
- CISO-005 server-identity + RBAC (ownership-guard UC-TS-07/PLN-13; закроет raw-API остаток CISO-012).
- Department headcount-фикс — server-конфликт метаданных 94c519b4-класс (drop/labelIdentifier-в-том-же-sync падают; см ниже).
- WorkType labelIdentifier=title (отдельным деплоем после создания поля).

## КРИТИЧНЫЕ ГРАБЛИ SDK (память twenty-sdk-apply-gotchas)
1. DROP поля/объекта → apply падает (`Migration update objectMetadata failed`). НЕ удалять поля — убирать только колонку из view.
2. labelIdentifier к полю, создаваемому в ТОМ ЖЕ sync → падает. Назначать отдельным деплоем.
3. Слаг `name` зарезервирован (авто-поле). Использовать `title`. У объектов ЕСТЬ встроенный `name` с реальными значениями — проверять перед добавлением.
4. nav FOLDER не топосортится → `NAVIGATION_MENU_ITEM_NOT_FOUND`. TWO-PHASE: Фаза1 деплой папок (дети на старой) → Фаза2 репойнт детей.
5. apply НЕ транзакционен — упавший деплой частично мутирует метадату → конфликт на UUID.
6. dry-run «apply-ready» НЕ гарантирует apply — гейт = реальный `dev --once` + «Synced».
7. singleton-настройки могли задвоиться при многих app:install — проверять кол-во записей credosTimeSettings (должна 1, reveal=true).

## ПРОЦЕСС (AITEAM, арх=я)
Зоны: Dev1=front-components/views/page-layouts/nav · Dev2=objects/fields/logic-functions/scripts. Я гейчу (lint 0 + test:unit «0 failed» + dry-run чисто incl apply) → коммит точечно → деплой → PUSH origin main. НЕ git add -A при активном агенте. Канал: `.AITEAM/SIGNALS.md`. Рейтлимит агентов был — делать самому/retry. Заказчик может слать задачи агентам напрямую ([user-direct]).

## ОГРАНИЧЕНИЯ
- Песочница front-component = Web Worker Remote DOM: нет host-DOM/drag/window.confirm/Blob-download (CSV-скачивание = host-bridge follow-up; поповеры на useState).
- НЕТ биллируемости ([[no-billable-concept]]) — без bill-rate/billable-полей даже если референсы советуют.
- ПДн 152-ФЗ: ФИО по revealEmployeeNames (=true на проде сейчас); reveal=false → КОД «Сотрудник·отдел·hex».
- Все справочники/UI на русском.

## СЛЕДУЮЩИЙ ШАГ
1. Дождаться 4 аналитиков волны-1 → свести вопросы в индекс + дать заказчику.
2. Запустить волну-2 (ещё серии).
3. Заказчик отвечает на вопросы → свести в ТЗ переделки контролов → реализация (Dev1, two-phase если nav).
4. По go-ahead: финансы / RBAC / Department-фикс.
