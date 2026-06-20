# 🎨 UI-компоненты и блоки контента

## shadcn/ui компоненты

### Установленные компоненты (60+)

```bash
# Базовые
accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
breadcrumb, button, calendar, card, carousel, checkbox,
collapsible, command, context-menu, dialog, drawer, dropdown-menu,
form, hover-card, input, input-otp, label, menubar, navigation-menu,
pagination, popover, progress, radio-group, scroll-area, select,
separator, sheet, sidebar, skeleton, slider, sonner, switch,
table, tabs, textarea, toast, toggle, toggle-group, tooltip
```

### Кастомные компоненты (Credos)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `CredosButton` | `ui/credos-button.tsx` | Брендированная кнопка |
| `CredosCard` | `ui/credos-card.tsx` | Брендированная карточка |
| `DecorativeDiamonds` | `ui/decorative-diamonds.tsx` | Декоративные элементы |
| `ButtonGroup` | `ui/button-group.tsx` | Группа кнопок |
| `InputGroup` | `ui/input-group.tsx` | Группа полей ввода |
| `Breadcrumbs` | `ui/breadcrumbs.tsx` | Хлебные крошки (расширенный) |
| `Empty` | `ui/empty.tsx` | Пустое состояние |
| `Field` | `ui/field.tsx` | Поле формы |
| `Item` | `ui/item.tsx` | Элемент списка |
| `Kbd` | `ui/kbd.tsx` | Клавиатурные сокращения |
| `Spinner` | `ui/spinner.tsx` | Индикатор загрузки |
| `Toaster` | `ui/toaster.tsx` | Провайдер тостов |

### Использование по модулям

| Модуль | Компоненты |
|--------|------------|
| **Layout** | `sidebar`, `navigation-menu`, `breadcrumb`, `avatar`, `dropdown-menu`, `sheet`, `command` |
| **Каталог услуг** | `card`, `badge`, `tabs`, `accordion`, `skeleton`, `separator` |
| **Таблицы** | `table`, `dropdown-menu`, `badge`, `pagination` |
| **Формы** | `form`, `input`, `textarea`, `select`, `button`, `checkbox`, `switch` |
| **Модалки** | `dialog`, `sheet`, `drawer`, `alert-dialog` |
| **Уведомления** | `toast`, `sonner` |
| **Навигация** | `command`, `navigation-menu`, `tabs` |

---

## TipTap редактор

### Текущая реализация

```
components/editor/
└── tiptap-editor.tsx    # Базовый WYSIWYG редактор
```

### Установленные расширения

| Расширение | Назначение |
|------------|------------|
| `@tiptap/starter-kit` | Базовые (текст, заголовки, списки) |
| `@tiptap/extension-image` | Изображения |
| `@tiptap/extension-link` | Ссылки |
| `@tiptap/extension-placeholder` | Плейсхолдер |

### Планируемые кастомные блоки (Hi-Fi MVP)

#### 1. ProductEmbed — Карточка продукта

```tsx
interface ProductEmbedAttrs {
  productId: string
}
// Встраиваемая карточка продукта из справочника
```

#### 2. ServiceLink — Ссылка на услугу

```tsx
interface ServiceLinkAttrs {
  serviceId: string
  relationType?: 'related' | 'prerequisite' | 'followup'
}
// Ссылка на другую услугу с превью
```

#### 3. EmployeeCard — Карточка сотрудника

```tsx
interface EmployeeCardAttrs {
  employeeId: string
  showCompetencies?: boolean
}
// Карточка сотрудника с аватаром и компетенциями
```

#### 4. Callout — Выделенный блок

```tsx
type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip'
interface CalloutAttrs {
  type: CalloutType
  title?: string
}
// Выделенный блок для важной информации
```

#### 5. StepsBlock — Этапы выполнения

```tsx
interface Step {
  title: string
  description?: string
}
interface StepsBlockAttrs {
  steps: Step[]
}
// Нумерованные этапы с описанием
```

---

## Страницы и компоненты (актуальные)

### Layout (`components/layout/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `AppLayout` | `app-layout.tsx` | Основной layout приложения |
| `AppSidebar` | `app-sidebar.tsx` | Боковое меню с навигацией |
| `NavUser` | `nav-user.tsx` | Меню пользователя в sidebar |
| `PageHeader` | `page-header.tsx` | Заголовок страницы с breadcrumbs |

### Services (`components/services/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `ServiceList` | `service-list.tsx` | Список услуг (сетка карточек) |
| `ServiceListSkeleton` | `service-list-skeleton.tsx` | Скелетон списка |
| `ServiceCard` | `service-card.tsx` | Карточка услуги в списке |
| `ServiceCardSkeleton` | `service-card-skeleton.tsx` | Скелетон карточки |
| `ServiceView` | `service-view.tsx` | Полная страница услуги |
| `ServiceViewSkeleton` | `service-view-skeleton.tsx` | Скелетон страницы |
| `ServiceEditor` | `service-editor.tsx` | Редактор услуги (TipTap) |
| `ServiceFilters` | `service-filters.tsx` | Панель фильтров |
| `ServiceMeta` | `service-meta.tsx` | Метаданные (владелец, версия, даты) |
| `ServiceStatusBadge` | `service-status-badge.tsx` | Бейдж статуса |
| `RelatedServices` | `related-services.tsx` | Связанные услуги |

### Products (`components/products/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `ProductCard` | `product-card.tsx` | Карточка продукта |
| `ProductView` | `product-view.tsx` | Страница продукта |

### Employees (`components/employees/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `EmployeeCard` | `employee-card.tsx` | Карточка сотрудника |
| `EmployeeList` | `employee-list.tsx` | Список сотрудников |

### Competencies (`components/competencies/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `CompetencyMatrix` | `competency-matrix.tsx` | Матрица компетенций |

### Analytics (`components/analytics/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `AnalyticsDashboard` | `analytics-dashboard.tsx` | Дашборд аналитики |

### Help (`components/help/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `HelpSearch` | `help-search.tsx` | Поиск по справке |
| `HelpArticleCard` | `help-article-card.tsx` | Карточка статьи |
| `HelpArticleView` | `help-article-view.tsx` | Полный просмотр статьи |
| `ContextualHelp` | `contextual-help.tsx` | Контекстные подсказки (Popover) |
| `QuickTipsBanner` | `quick-tips-banner.tsx` | Баннер с советами |
| `InteractiveChecklist` | `interactive-checklist.tsx` | Интерактивный чеклист |
| `InteractiveServiceDemo` | `interactive-service-demo.tsx` | Демо работы с услугами |
| `CommandPaletteDemo` | `command-palette-demo.tsx` | Демо горячих клавиш |

### Shared (`components/shared/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `CommandMenu` | `command-menu.tsx` | ⌘K глобальный поиск |
| `SearchInput` | `search-input.tsx` | Поле поиска |
| `StatusBadge` | `status-badge.tsx` | Универсальный бейдж статуса |
| `EmptyState` | `empty-state.tsx` | Пустое состояние |

### Editor (`components/editor/`)

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `TipTapEditor` | `tiptap-editor.tsx` | WYSIWYG редактор |

---

## Стилизация

### CSS Variables (Credos Theme)

```css
/* app/globals.css */

@layer base {
  :root {
    /* Background */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    /* Primary — Credos Blue */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    
    /* Secondary */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    /* Muted */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    /* Accent */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    /* Destructive */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    /* Border & Input */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    
    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode переменные */
  }
}
```

### Tailwind Config

Используется Tailwind CSS 4.x с CSS переменными shadcn/ui.

---

## Хуки (`hooks/`)

| Хук | Файл | Назначение |
|-----|------|------------|
| `useServiceFilters` | `use-service-filters.ts` | URL state для фильтров услуг (nuqs) |
| `useMobile` | `use-mobile.ts` | Определение мобильного устройства |
| `useToast` | `use-toast.ts` | Toast уведомления |

---

## Паттерны именования файлов

### Компоненты

| Паттерн | Пример | Назначение |
|---------|--------|------------|
| `{entity}-{type}.tsx` | `service-card.tsx` | Основной компонент |
| `{entity}-{type}-skeleton.tsx` | `service-card-skeleton.tsx` | Скелетон загрузки |
| `{entity}-{type}.types.ts` | `service-filters.types.ts` | Типы компонента |
| `index.ts` | `index.ts` | Barrel export |

### Pages

| Паттерн | Пример | Назначение |
|---------|--------|------------|
| `page.tsx` | `services/page.tsx` | Страница маршрута |
| `loading.tsx` | `services/loading.tsx` | Loading UI |
| `not-found.tsx` | `services/[id]/not-found.tsx` | 404 страница |
| `layout.tsx` | `(dashboard)/layout.tsx` | Layout группы |

---

## MCP-интеграция (для AI-ассистентов)

Подключён **shadcn MCP-сервер** — используй для:

| Действие | MCP-команда |
|----------|-------------|
| Найти компонент | `search_items_in_registries` |
| Посмотреть API | `view_items_in_registries` |
| Примеры кода | `get_item_examples_from_registries` |
| Команда установки | `get_add_command_for_items` |
