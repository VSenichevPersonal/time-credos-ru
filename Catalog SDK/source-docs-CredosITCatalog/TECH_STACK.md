# 🛠️ Технологический стек

> Приоритет: **быстрая разработка** с использованием готовых open-source решений

---

## ✅ ИСПОЛЬЗУЕМ (установлено)

### Core Framework

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Next.js** | 16.1.4 | React framework, App Router, SSR/SSG |
| **React** | 19.2.3 | UI библиотека |
| **TypeScript** | 5.x | Типизация |

### Styling & UI

| Технология | Назначение | Почему |
|------------|------------|--------|
| **Tailwind CSS** | 4.x | Стили | Быстрая разработка, utility-first |
| **shadcn/ui** | UI компоненты | Копируемые, кастомизируемые, красивые |
| **Lucide React** | 0.562.x | Иконки | Встроено в shadcn |
| **tailwind-merge** | 3.4.x | Мердж классов | Для cn() утилиты |
| **class-variance-authority** | 0.7.x | Варианты стилей | Для вариантов компонентов |
| **tailwindcss-animate** | 1.0.x | Анимации | CSS анимации для shadcn |

### Rich Text Editor

| Технология | Версия | Назначение |
|------------|--------|------------|
| **@tiptap/react** | 3.16.x | WYSIWYG редактор |
| **@tiptap/starter-kit** | 3.16.x | Базовые расширения |
| **@tiptap/extension-image** | 3.16.x | Изображения |
| **@tiptap/extension-link** | 3.16.x | Ссылки |
| **@tiptap/extension-placeholder** | 3.16.x | Placeholder текст |

### Формы и валидация

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Zod** | 4.3.x | Runtime валидация схем |
| **React Hook Form** | 7.71.x | Управление формами |
| **@hookform/resolvers** | 5.2.x | Интеграция Zod с RHF |

### UI компоненты (дополнительные)

| Технология | Версия | Назначение |
|------------|--------|------------|
| **cmdk** | 1.1.x | Command palette (⌘K) |
| **sonner** | 2.0.x | Тосты/уведомления |
| **vaul** | 1.1.x | Drawer компонент |
| **embla-carousel-react** | 8.6.x | Карусель |
| **react-day-picker** | 9.13.x | Календарь |
| **react-resizable-panels** | 4.4.x | Resizable панели |
| **input-otp** | 1.4.x | OTP input |

### Работа с данными

| Технология | Версия | Назначение |
|------------|--------|------------|
| **nuqs** | 2.8.x | URL state management |
| **date-fns** | 4.1.x | Работа с датами |

### Графики и аналитика

| Технология | Версия | Назначение |
|------------|--------|------------|
| **recharts** | 3.7.x | Графики и чарты |

### Themes

| Технология | Версия | Назначение |
|------------|--------|------------|
| **next-themes** | 0.4.x | Dark/Light mode |

### Radix UI Primitives (через shadcn/ui)

Полный список установленных Radix примитивов:
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-label`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`

---

## 🟡 ПЛАНИРУЕТСЯ (для Hi-Fi MVP)

### База данных

| Технология | Назначение | Когда |
|------------|------------|-------|
| **PostgreSQL** | База данных | Hi-Fi MVP |
| **Prisma** | ORM | Hi-Fi MVP |

### Авторизация

| Технология | Назначение | Когда |
|------------|------------|-------|
| **NextAuth.js (Auth.js)** | Авторизация | Hi-Fi MVP |
| **bcryptjs** | Хеширование паролей | Hi-Fi MVP |

### Экспорт

| Технология | Назначение | Когда |
|------------|------------|-------|
| **@react-pdf/renderer** | PDF генерация | Hi-Fi MVP |
| **docx** | Word генерация | Hi-Fi MVP |
| **xlsx** | Excel генерация | Hi-Fi MVP |

### Кеширование данных

| Технология | Назначение | Когда |
|------------|------------|-------|
| **@tanstack/react-query** | Кеширование и синхронизация | При необходимости |

---

## ❌ НЕ ИСПОЛЬЗУЕМ

| Технология | Почему нет |
|------------|------------|
| Material UI | Используем shadcn/ui |
| Ant Design | Используем shadcn/ui |
| Redux | Достаточно React state + nuqs для URL |
| MongoDB | PostgreSQL лучше для связей |
| GraphQL | REST/Server Actions проще для MVP |

---

## 📦 Готовые компоненты shadcn/ui

### Установленные компоненты:

```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
breadcrumb, button, calendar, card, carousel, checkbox,
collapsible, command, context-menu, dialog, drawer, dropdown-menu,
form, hover-card, input, input-otp, label, menubar, navigation-menu,
pagination, popover, progress, radio-group, scroll-area, select,
separator, sheet, sidebar, skeleton, slider, sonner, switch,
table, tabs, textarea, toast, toggle, toggle-group, tooltip
```

### Кастомные компоненты (созданы для проекта):

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `credos-button` | `ui/credos-button.tsx` | Брендированная кнопка |
| `credos-card` | `ui/credos-card.tsx` | Брендированная карточка |
| `decorative-diamonds` | `ui/decorative-diamonds.tsx` | Декоративные элементы |
| `button-group` | `ui/button-group.tsx` | Группа кнопок |
| `input-group` | `ui/input-group.tsx` | Группа полей ввода |
| `breadcrumbs` | `ui/breadcrumbs.tsx` | Хлебные крошки (расширенный) |
| `empty` | `ui/empty.tsx` | Пустое состояние |
| `field` | `ui/field.tsx` | Поле формы |
| `item` | `ui/item.tsx` | Элемент списка |
| `kbd` | `ui/kbd.tsx` | Клавиатурные сокращения |
| `spinner` | `ui/spinner.tsx` | Индикатор загрузки |

---

## 🧱 TipTap: Расширения

### Установленные расширения:

| Расширение | Назначение |
|------------|------------|
| `@tiptap/starter-kit` | Базовые (текст, заголовки, списки) |
| `@tiptap/extension-image` | Изображения |
| `@tiptap/extension-link` | Ссылки |
| `@tiptap/extension-placeholder` | Плейсхолдер |

### Планируемые расширения (для Hi-Fi MVP):

| Расширение | Назначение |
|------------|------------|
| `@tiptap/extension-table` | Таблицы |
| `@tiptap/extension-typography` | Типографика |
| `@tiptap/extension-code-block-lowlight` | Код с подсветкой |
| `@tiptap/extension-task-list` | Чек-листы |
| `@tiptap/extension-highlight` | Выделение текста |
| `@tiptap/extension-text-align` | Выравнивание |

---

## 🚀 Deployment (Railway)

### Текущая конфигурация:

| Параметр | Значение |
|----------|----------|
| Platform | Railway |
| Builder | NIXPACKS |
| Node.js | 20 (из `.nvmrc`) |
| Healthcheck | `/api/health` |

### Переменные окружения (Production):

```env
# App
NEXT_PUBLIC_APP_URL="https://..."

# Database (для Hi-Fi MVP)
DATABASE_URL="postgresql://..."

# Auth (для Hi-Fi MVP)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://..."
```

---

## 📚 Полезные ресурсы

| Ресурс | Ссылка |
|--------|--------|
| shadcn/ui Docs | https://ui.shadcn.com |
| TipTap Docs | https://tiptap.dev |
| Next.js Docs | https://nextjs.org/docs |
| Tailwind Docs | https://tailwindcss.com/docs |
| nuqs Docs | https://nuqs.47ng.com |
| Recharts Docs | https://recharts.org |
