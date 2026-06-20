# 🏗️ Архитектура системы

## Обзор

```
┌─────────────────────────────────────────────────────────────┐
│                      CREDOS KNOWLEDGE HUB                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Next.js   │  │   TipTap    │  │   shadcn/ui         │ │
│  │  App Router │  │   Editor    │  │   Components        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┴─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │                   Data Layer                          │ │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │   Pre-MVP:      │  │   Hi-Fi MVP:                │ │ │
│  │  │   JSON/TS Files │  │   PostgreSQL + Prisma       │ │ │
│  │  │   ✅ Текущая    │  │   📋 Планируется            │ │ │
│  │  └─────────────────┘  └─────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Фазы разработки

### Phase 1: Pre-MVP (File-based) — ✅ Текущая фаза

```
src/
├── data/                     # Мок-данные (TypeScript файлы)
│   ├── services.ts          # Услуги (~40 записей)
│   ├── products.ts          # Продукты
│   ├── employees.ts         # Сотрудники
│   ├── competencies.ts      # Компетенции
│   ├── directions.ts        # Отделы
│   ├── categories.ts        # Категории
│   ├── vendors.ts           # Вендоры
│   └── types.ts             # TypeScript интерфейсы
│
├── lib/
│   ├── data/                # Data Access Layer (простой)
│   │   ├── services.ts      # getServices(), getServiceById()
│   │   ├── products.ts      # getProducts(), getProductById()
│   │   └── employees.ts     # getEmployees()
│   │
│   └── repositories/        # Repository Layer (продвинутый)
│       ├── services.repository.ts    # Фильтрация, связи, кеш
│       ├── service-relations.repository.ts
│       └── types.ts         # Типы для репозиториев
```

**Преимущества:**
- Быстрый старт без настройки БД
- Легко менять структуру данных
- Простая миграция на Prisma (интерфейсы те же)

### Phase 2: Hi-Fi MVP (PostgreSQL + Prisma) — 📋 Планируется

```
prisma/
├── schema.prisma            # Схема БД
├── migrations/              # Миграции
└── seed.ts                  # Начальные данные

src/
├── lib/
│   ├── prisma.ts           # Prisma client
│   └── repositories/       # Repository Layer (те же интерфейсы!)
│       ├── services.repository.ts     # Теперь через Prisma
│       └── ...
```

---

## Структура проекта (актуальная)

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Группа: основное приложение
│   │   ├── layout.tsx           # Layout с сайдбаром
│   │   │
│   │   ├── services/            # Каталог услуг
│   │   │   ├── page.tsx         # Список услуг
│   │   │   ├── loading.tsx      # Loading state
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Карточка услуги (просмотр)
│   │   │       ├── loading.tsx
│   │   │       ├── not-found.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx # Редактирование
│   │   │
│   │   ├── products/            # Реестр продуктов
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── employees/           # Сотрудники
│   │   │   └── page.tsx
│   │   │
│   │   ├── competencies/        # Компетенции
│   │   │   └── page.tsx         # Матрица компетенций
│   │   │
│   │   ├── analytics/           # Дашборды
│   │   │   └── page.tsx
│   │   │
│   │   └── help/                # Справочная система
│   │       └── page.tsx         # Интерактивная справка
│   │
│   ├── api/                     # API Routes
│   │   └── health/
│   │       └── route.ts         # Healthcheck для Railway
│   │
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Главная (редирект на services)
│   ├── not-found.tsx            # 404 страница
│   └── globals.css
│
├── components/
│   ├── ui/                      # shadcn/ui компоненты (60+ файлов)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   │
│   ├── layout/                  # Layout компоненты
│   │   ├── app-layout.tsx       # Основной layout
│   │   ├── app-sidebar.tsx      # Боковое меню
│   │   ├── nav-user.tsx         # Меню пользователя
│   │   ├── page-header.tsx      # Заголовок страницы
│   │   └── index.ts
│   │
│   ├── services/                # Компоненты услуг
│   │   ├── service-card.tsx
│   │   ├── service-card-skeleton.tsx
│   │   ├── service-list.tsx
│   │   ├── service-list-skeleton.tsx
│   │   ├── service-view.tsx
│   │   ├── service-view-skeleton.tsx
│   │   ├── service-editor.tsx
│   │   ├── service-filters.tsx
│   │   ├── service-filters.types.ts
│   │   ├── service-meta.tsx
│   │   ├── service-status-badge.tsx
│   │   ├── related-services.tsx
│   │   └── index.ts
│   │
│   ├── products/                # Компоненты продуктов
│   │   ├── product-card.tsx
│   │   ├── product-view.tsx
│   │   └── index.ts
│   │
│   ├── employees/               # Компоненты сотрудников
│   │   ├── employee-card.tsx
│   │   ├── employee-list.tsx
│   │   └── index.ts
│   │
│   ├── competencies/            # Компетенции
│   │   └── competency-matrix.tsx
│   │
│   ├── analytics/               # Аналитика
│   │   ├── analytics-dashboard.tsx
│   │   └── index.ts
│   │
│   ├── help/                    # Справочная система
│   │   ├── help-search.tsx
│   │   ├── help-article-card.tsx
│   │   ├── help-article-view.tsx
│   │   ├── contextual-help.tsx
│   │   ├── quick-tips-banner.tsx
│   │   ├── interactive-checklist.tsx
│   │   ├── interactive-service-demo.tsx
│   │   ├── command-palette-demo.tsx
│   │   ├── README.md
│   │   └── index.ts
│   │
│   ├── editor/                  # TipTap редактор
│   │   └── tiptap-editor.tsx
│   │
│   ├── shared/                  # Общие компоненты
│   │   ├── command-menu.tsx     # ⌘K меню
│   │   ├── search-input.tsx
│   │   ├── status-badge.tsx
│   │   └── empty-state.tsx
│   │
│   └── theme-provider.tsx       # Dark/Light mode
│
├── data/                        # Мок-данные Pre-MVP
│   ├── services.ts
│   ├── products.ts
│   ├── employees.ts
│   ├── competencies.ts
│   ├── directions.ts
│   ├── categories.ts
│   ├── vendors.ts
│   ├── service-products.ts      # Связи услуга-продукт
│   ├── service-relations.ts     # Связи между услугами
│   ├── service-competencies.ts  # Требуемые компетенции
│   ├── employee-competencies.ts # Компетенции сотрудников
│   ├── documents.ts             # Документы
│   ├── constants/
│   │   └── service-statuses.ts
│   ├── help/                    # Данные справки
│   │   ├── articles.tsx
│   │   ├── categories.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── types.ts                 # Типы данных
│   └── index.ts
│
├── hooks/                       # Кастомные хуки
│   ├── use-service-filters.ts   # URL state для фильтров (nuqs)
│   ├── use-mobile.ts            # Определение мобильного устройства
│   └── use-toast.ts             # Toast уведомления
│
├── lib/
│   ├── utils.ts                 # Общие утилиты (cn, и др.)
│   ├── utils/
│   │   └── search.ts            # Утилиты поиска
│   ├── data/                    # Data Access Layer (простой)
│   │   ├── services.ts
│   │   ├── products.ts
│   │   ├── employees.ts
│   │   └── service-products.ts
│   └── repositories/            # Repository Layer (продвинутый)
│       ├── services.repository.ts
│       ├── service-relations.repository.ts
│       ├── types.ts
│       └── index.ts
│
└── (планируется)
    └── types/                   # Глобальные типы
        └── index.ts
```

---

## Data Access Layer (абстракция)

Ключевая идея: **одинаковый интерфейс для файлов и БД**.

### Простой уровень (`lib/data/`)

```typescript
// lib/data/services.ts — простые функции
import { services } from '@/data/services'

export async function getServices(): Promise<Service[]> {
  return services
}

export async function getServiceById(id: string): Promise<Service | null> {
  return services.find(s => s.id === id) ?? null
}
```

### Repository уровень (`lib/repositories/`)

```typescript
// lib/repositories/services.repository.ts — продвинутые функции
import { cache } from 'react'

export const getServices = cache(
  async (filters: ServiceFilters = {}): Promise<Service[]> => {
    let result = applyFilters(services, filters)
    // Пагинация, сортировка...
    return result
  }
)

export const getServiceWithRelations = cache(
  async (idOrSlug: string): Promise<ServiceWithRelations | null> => {
    // Загрузка связей параллельно
    const [category, products, relations] = await Promise.all([...])
    return { ...service, category, direction, products, relations }
  }
)
```

**Преимущества Repository Layer:**
- Кеширование через `cache()` из React
- Фильтрация и пагинация
- Загрузка связей
- Готов к миграции на Prisma

---

## Связи между сущностями

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Direction  │────▶│  Category   │────▶│   Service   │
│   (Отдел)   │     │ (Категория) │     │   (Услуга)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
       ┌───────────────┬───────────────────────┼───────────────────┐
       │               │                       │                   │
       ▼               ▼                       ▼                   ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌─────────────┐
│  Document   │ │   Product   │ │ServiceCompetency │ │ServiceRelation│
│ (Документ)  │ │  (Продукт)  │ │(Требуемые навыки)│ │   (Связи)   │
└─────────────┘ └──────┬──────┘ └────────┬─────────┘ └─────────────┘
                       │                 │
                       ▼                 ▼
                ┌─────────────┐   ┌─────────────┐
                │   Vendor    │   │ Competency  │
                │  (Вендор)   │   │   (Навык)   │
                └─────────────┘   └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │  Employee   │
                                  │ (Сотрудник) │
                                  └─────────────┘
```

---

## URL State Management (nuqs)

Фильтры синхронизируются с URL через `nuqs`:

```typescript
// hooks/use-service-filters.ts
export function useServiceFilters() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('all'))
  const [status, setStatus] = useQueryState('status', parseAsString)
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  
  // URL: /services?tab=oib&status=active&q=аудит
}
```

**Преимущества:**
- Deep linking — можно шарить URL с фильтрами
- History — работает back/forward браузера
- SSR compatible — работает с Server Components

---

## RBAC (Role-Based Access Control) — 📋 Планируется

### Роли и права

| Роль | services | products | employees | documents | settings |
|------|----------|----------|-----------|-----------|----------|
| **admin** | CRUD | CRUD | CRUD | CRUD | CRUD |
| **department_head** | CRUD (свой отдел) | Read | Read (свой) | CRUD | - |
| **editor** | CRU (назначенные) | Read | Read | CRU | - |
| **sales_manager** | Read | Read | Read | Read | - |
| **employee** | Read | Read | Read (свой) | Read | - |
| **guest** | Read (limited) | - | - | - | - |

---

## Workflow согласования — 📋 Планируется

```
┌─────────┐    submit     ┌──────────────┐   approve   ┌─────────┐
│  Draft  │──────────────▶│ На согласов. │────────────▶│ Active  │
└─────────┘               └──────────────┘             └─────────┘
                                │                           │
                                │ reject                    │ deprecate
                                ▼                           ▼
                          ┌─────────┐              ┌────────────┐
                          │  Draft  │              │ Deprecated │
                          └─────────┘              └────────────┘
                                                         │
                                                         │ archive
                                                         ▼
                                                   ┌──────────┐
                                                   │  Архив   │
                                                   └──────────┘
```
