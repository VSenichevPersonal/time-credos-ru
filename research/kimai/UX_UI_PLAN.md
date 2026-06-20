# Time Tracking — UX/UI: единый с CRM или отдельно?

**Дата:** 2026-06-20

---

## ТРИ ВАРИАНТА

| Вариант | Где живёт | Изоляция | Переиспользование | Скорость |
|---------|-----------|----------|-------------------|----------|
| **1. Metadata-объекты** | Внутри CRM (объекты как Company/Deal) | ❌ Смешивается | ✅ Auto UI | 1 день |
| **2. credos/timetracker/** | Отдельные страницы в том же приложении | ✅ Чисто | ✅ UI-библиотека + темы | 3-5 дней |
| **3. Отдельный микросервис** | Как credos-integrations | ✅ Максимально | ⚠️ Свой UI с нуля | 2-4 недели |

---

## РЕКОМЕНДАЦИЯ: Вариант 2 — `credos/timetracker/`

**Почему не metadata-объекты:**
- Таймшиты — не CRM-сущность, не надо смешивать с компаниями/сделками
- UX таймшита (недельная сетка, таймер) радикально отличается от CRM (списки/карточки)
- Пользователь проводит в таймшитах часы в неделю — нужен оптимизированный UX

**Почему не отдельный сервис:**
- Долго (2-4 недели вместо 3-5 дней)
- Свой UI с нуля (темы, компоненты, адаптивность)
- Своя аутентификация
- Инфраструктура (новый Railway-сервис)

**Почему credos/timetracker/:**
- ✅ **Не засоряет CRM** — собственные страницы, свой роутинг
- ✅ **Переиспользует Twenty UI** — 40+ компонентов (Button, Input, Modal, Card, Table, Tab, ...)
- ✅ **Переиспользует темы** — dark/light, адаптивность, кастомные CSS-переменные
- ✅ **Переиспользует auth** — пользователь уже залогинен
- ✅ **Переиспользует GraphQL/REST** — доступ к данным без нового API
- ✅ **Проверенный паттерн** — Beeline, Quotes, Dashboards сделаны так же

---

## КАК ЭТО ВЫГЛЯДИТ (структура)

```
packages/twenty-front/src/credos/timetracker/
├── pages/
│   ├── TimesheetPage.tsx          — недельная сетка (основной экран)
│   ├── TimesheetHistoryPage.tsx   — история таймшитов
│   └── TimesheetApprovalPage.tsx  — согласование (для менеджеров)
├── components/
│   ├── WeeklyGrid.tsx             — сетка (дни × строки) ← главный виджет
│   ├── TimesheetLine.tsx          — строка таймшита
│   ├── HourCell.tsx               — ячейка с часами
│   ├── DayTotal.tsx               — итог за день
│   ├── Timer.tsx                  — таймер (Kimai-стиль)
│   ├── TimerControls.tsx          — старт/стоп/пауза
│   └── TimesheetStatusBadge.tsx   — статус (Draft/Submitted...)
├── hooks/
│   ├── useTimesheet.ts            — загрузка таймшита
│   ├── useTimer.ts                — логика таймера
│   └── useSubmitTimesheet.ts      — отправка на согласование
├── states/
│   └── currentTimesheetState.ts   — Jotai-состояние
├── graphql/
│   ├── queries.ts                 — GraphQL-запросы
│   └── mutations.ts              — GraphQL-мутации
└── utils/
    ├── timeUtils.ts               — расчёт часов, форматирование
    └── weekUtils.ts               — навигация по неделям

packages/twenty-server/src/credos/timetracker/
├── controllers/
│   └── timesheet.controller.ts    — REST API (если нужно)
├── services/
│   ├── timesheet.service.ts       — бизнес-логика
│   ├── timesheet-period.service.ts — создание периодов
│   └── timesheet-validation.service.ts — валидация
├── hooks/
│   ├── timesheet-create.hook.ts   — post-hook создания
│   └── timesheet-submit.hook.ts   — pre-hook отправки
├── resolvers/
│   └── timesheet.resolver.ts      — GraphQL резолверы (если metadata)
└── entities/
    └── timesheet.entity.ts        — только если нужна кастомная таблица
```

---

## UI-КОМПОНЕНТЫ (из Twenty UI)

Уже доступны для переиспользования:

```typescript
// Из twenty-ui (общая библиотека)
import { Button, TabButton } from 'twenty-ui/input/button';
import { Text, Status, Icon, Typography } from 'twenty-ui/display';
import { Card, Section, Modal } from 'twenty-ui/layout';
import { ThemeProvider, themeCssVariables } from 'twenty-ui/theme';

// Из twenty-front (layout-обёртки)
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
```

**То, что нужно ДОБАВИТЬ (кастомные компоненты для таймшита):**
- `WeeklyGrid` — сетка дней × строк (главный компонент)
- `Timer` — запуск/стоп таймера
- `HourCell` — редактируемая ячейка с часами

Эти три компонента — **чистый React + Linaria (CSS-in-JS)**, используют Twenty UI-токены:

```tsx
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const WeeklyGrid = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 1px;
  background: ${themeCssVariables.borderColor};
`;
```

---

## ВНЕШНИЙ ВИД

### Недельная сетка (основной экран)
```
┌─ TimeTracker ─────────────────────────────────────────────┐
│ ← Пред. │ 15—21 июня 2026 │ След. → │ [⏱ Старт] │ Черновик│
├──────────────────────────────────────────────────────────┤
│ Клиент / Проект / Работа    │Пн│Вт│Ср│Чт│Пт│Сб│Вс│ Итог  │
├──────────────────────────────────────────────────────────┤
│ Сибур > Тех.поддержка       │  │ 2│ 3│  │  │  │  │   5   │
│   Поддержка Q1 (Аудит)     │  │  │  │  │  │  │  │       │
│ Главстрой > Оптимизация БП  │ 4│  │  │ 2│  │  │  │   6   │
│   Внедрение (Консалтинг)    │  │  │  │  │  │  │  │       │
├──────────────────────────────────────────────────────────┤
│ ИТОГО                        │ 4│ 2│ 3│ 2│  │  │  │  11   │
│ План                          │ 8│ 8│ 8│ 8│ 8│ 0│ 0│  40   │
└──────────────────────────────────────────────────────────┘
```

### Таймер (постоянно висит в хедере или плавающий)
```
┌──────────────────┐
│ ⏱ 02:34          │
│ Аудит процессов  │
│ [⏹ Стоп]        │
└──────────────────┘
```

---

## ИТОГО

**Отдельный модуль — ДА, без засорения CRM.**

- Живёт в `credos/timetracker/` (как Beeline, Quotes)
- Свой роутинг, свои страницы
- Использует Twenty UI (компоненты + темы + адаптивность)
- Имеет свой UX (недельная сетка + таймер — не CRM-style)
- Пользователь переключается между CRM и трекером через навигацию — как разные разделы

**Срок:** 3-5 дней (против 1-2 недель с metadata-объектами, но без засорения CRM)
