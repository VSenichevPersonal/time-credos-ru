# 📊 Модель данных

> **Текущее состояние:** Pre-MVP с файловыми данными (`src/data/*.ts`)
> 
> **Планируется:** PostgreSQL + Prisma для Hi-Fi MVP

## Обзор сущностей

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐                 │
│  │ Direction │──▶│ Category  │──▶│  Service  │                 │
│  │  (Отдел)  │   │(Категория)│   │  (Услуга) │                 │
│  └───────────┘   └───────────┘   └─────┬─────┘                 │
│                                        │                        │
│       ┌────────────────────────────────┼────────────────┐      │
│       │              │                 │                │      │
│       ▼              ▼                 ▼                ▼      │
│  ┌─────────┐   ┌─────────┐   ┌──────────────┐   ┌──────────┐  │
│  │Document │   │ Product │   │ Competency   │   │ Service  │  │
│  │(Документ│   │(Продукт)│   │Requirement   │   │ Relation │  │
│  └─────────┘   └────┬────┘   └──────┬───────┘   └──────────┘  │
│                     │               │                          │
│                     ▼               ▼                          │
│               ┌─────────┐   ┌────────────┐                     │
│               │ Vendor  │   │ Competency │                     │
│               │(Вендор) │   │  (Навык)   │                     │
│               └─────────┘   └─────┬──────┘                     │
│                                   │                             │
│                                   ▼                             │
│                            ┌────────────┐                       │
│                            │  Employee  │                       │
│                            │(Сотрудник) │                       │
│                            └────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Типы данных (TypeScript)

### Direction (Отдел/Направление)

```typescript
interface Direction {
  id: string
  name: string                    // "Отдел информационной безопасности"
  shortName: string               // "ОИБ"
  description?: string
  iconName?: string               // lucide icon name
  sortOrder: number
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

### Category (Категория)

```typescript
interface Category {
  id: string
  directionId: string             // FK → Direction
  name: string                    // "Аудит"
  description?: string
  sortOrder: number
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

### Service (Услуга)

```typescript
interface Service {
  id: string
  categoryId: string              // FK → Category
  
  // Основное
  name: string                    // "Аудит информационной безопасности"
  shortName?: string              // "Аудит ИБ"
  slug: string                    // "audit-ib"
  description?: string            // Краткое описание
  
  // Rich-контент (TipTap JSON)
  content?: TipTapContent         // Полное описание, этапы и т.д.
  
  // Метаданные
  status: ServiceStatus
  version: string                 // "1.0"
  
  // Владелец
  ownerId?: string                // FK → Employee (ответственный)
  
  // Итоговые документы
  deliverables?: string[]         // ["Отчёт об аудите", "Рекомендации"]
  
  // Сроки
  estimatedDuration?: string      // "10-15 дней"
  
  // Аудит
  createdAt: Date
  updatedAt: Date
  createdById?: string
  updatedById?: string
}

type ServiceStatus = 
  | 'draft'           // Черновик
  | 'pending_review'  // На согласовании
  | 'active'          // Активна
  | 'suspended'       // Приостановлена
  | 'deprecated'      // Устарела
  | 'archived'        // В архиве
```

### Product (Продукт)

```typescript
interface Product {
  id: string
  vendorId: string                // FK → Vendor
  
  name: string                    // "ViPNet Client"
  version?: string                // "4.5.2"
  description?: string
  
  category: ProductCategory       // VPN, NGFW, SIEM...
  
  // Документация
  documentationUrl?: string
  
  // Сертификация
  certificates?: ProductCertificate[]
  
  status: 'active' | 'testing' | 'deprecated' | 'archived'
  
  createdAt: Date
  updatedAt: Date
}

type ProductCategory = 
  | 'szi_nsd'         // СЗИ от НСД
  | 'vpn'             // VPN/Криптография
  | 'antivirus'       // Антивирус
  | 'scanner'         // Сканеры уязвимостей
  | 'ngfw'            // NGFW
  | 'siem'            // SIEM
  | 'edr_xdr'         // EDR/XDR
  | 'idm_pam'         // IDM/PAM
  | 'backup'          // Резервное копирование
  | 'trusted_boot'    // Доверенная загрузка
  | 'waf'             // WAF
  | 'dlp'             // DLP
  | 'other'

interface ProductCertificate {
  type: 'fstek' | 'fsb' | 'other'
  number: string                  // "№1234"
  validUntil?: Date
  description?: string
}
```

### Vendor (Вендор)

```typescript
interface Vendor {
  id: string
  name: string                    // "ИнфоТеКС"
  website?: string
  partnershipLevel?: string       // "Авторизованный партнёр"
  description?: string
  logoUrl?: string
  
  status: 'active' | 'archived'
  
  createdAt: Date
  updatedAt: Date
}
```

### Employee (Сотрудник)

```typescript
interface Employee {
  id: string
  
  // Персональные данные
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone?: string
  
  // Организационная структура
  directionId: string             // FK → Direction
  position: string                // "Ведущий инженер"
  
  // Профиль
  avatarUrl?: string
  bio?: string
  
  status: 'active' | 'inactive'
  
  createdAt: Date
  updatedAt: Date
}
```

### Competency (Компетенция/Навык)

```typescript
interface Competency {
  id: string
  
  name: string                    // "Аудит ИБ", "CISSP", "ViPNet"
  category: CompetencyCategory
  description?: string
  
  // Для сертификатов
  issuingOrganization?: string    // "ISC²"
  
  status: 'active' | 'archived'
  
  createdAt: Date
  updatedAt: Date
}

type CompetencyCategory = 
  | 'skill'           // Навык
  | 'certification'   // Сертификат
  | 'technology'      // Технология/продукт
```

### EmployeeCompetency (Связь сотрудник-компетенция)

```typescript
interface EmployeeCompetency {
  id: string
  employeeId: string              // FK → Employee
  competencyId: string            // FK → Competency
  
  level: CompetencyLevel
  
  // Для сертификатов
  certifiedAt?: Date
  expiresAt?: Date
  certificateNumber?: string
  
  notes?: string
  
  createdAt: Date
  updatedAt: Date
}

type CompetencyLevel = 
  | 'beginner'        // Начинающий
  | 'intermediate'    // Средний
  | 'advanced'        // Продвинутый
  | 'expert'          // Эксперт
```

### ServiceCompetency (Требуемые компетенции для услуги)

```typescript
interface ServiceCompetency {
  id: string
  serviceId: string               // FK → Service
  competencyId: string            // FK → Competency
  
  requiredLevel: CompetencyLevel
  isRequired: boolean             // Обязательная или желательная
  
  createdAt: Date
}
```

### ServiceProduct (Связь услуга-продукт)

```typescript
interface ServiceProduct {
  id: string
  serviceId: string               // FK → Service
  productId: string               // FK → Product
  
  usage?: string                  // Как используется в услуге
  
  createdAt: Date
}
```

### ServiceRelation (Связь между услугами)

```typescript
interface ServiceRelation {
  id: string
  serviceId: string               // FK → Service
  relatedServiceId: string        // FK → Service
  
  type: ServiceRelationType
  description?: string
  
  createdAt: Date
}

type ServiceRelationType = 
  | 'related'         // Связанные
  | 'prerequisite'    // Предусловие (сначала нужна эта)
  | 'followup'        // Продолжение (часто берут после)
  | 'alternative'     // Альтернатива
```

### Document (Документ)

```typescript
interface Document {
  id: string
  
  title: string                   // "Регламент проведения аудита ИБ"
  type: DocumentType
  
  // Контент (один из)
  fileUrl?: string                // Загруженный файл
  externalUrl?: string            // Внешняя ссылка
  content?: string                // Текстовый контент (markdown)
  
  // Версионирование
  version: string                 // "2.1"
  
  // Метаданные
  mimeType?: string
  fileSize?: number
  
  status: 'draft' | 'published' | 'archived'
  
  createdAt: Date
  updatedAt: Date
  createdById?: string
}

type DocumentType = 
  | 'regulation'      // Регламент
  | 'instruction'     // Инструкция
  | 'template'        // Шаблон
  | 'specification'   // Спецификация
  | 'checklist'       // Чек-лист
  | 'other'
```

### ServiceDocument (Связь услуга-документ)

```typescript
interface ServiceDocument {
  id: string
  serviceId: string               // FK → Service
  documentId: string              // FK → Document
  
  section?: string                // "regulation", "template"...
  sortOrder: number
  
  createdAt: Date
}
```

---

## User & Auth

```typescript
interface User {
  id: string
  email: string
  passwordHash: string
  
  employeeId?: string             // FK → Employee (если сотрудник)
  
  role: UserRole
  
  isActive: boolean
  lastLoginAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

type UserRole = 
  | 'admin'
  | 'department_head'
  | 'editor'
  | 'sales_manager'
  | 'employee'
  | 'guest'
```

---

## Текущая реализация (Pre-MVP)

Данные хранятся в TypeScript файлах в `src/data/`:

```
src/data/
├── types.ts                 # TypeScript интерфейсы
├── directions.ts            # Отделы (4 записи)
├── categories.ts            # Категории (~15 записей)
├── services.ts              # Услуги (~40 записей)
├── products.ts              # Продукты (~25 записей)
├── vendors.ts               # Вендоры (~15 записей)
├── employees.ts             # Сотрудники
├── competencies.ts          # Компетенции
├── documents.ts             # Документы
├── service-products.ts      # Связи услуга-продукт
├── service-relations.ts     # Связи между услугами
├── service-competencies.ts  # Требуемые компетенции
├── employee-competencies.ts # Компетенции сотрудников
├── constants/
│   └── service-statuses.ts  # Константы статусов
└── help/                    # Данные справочной системы
    ├── articles.tsx
    ├── categories.ts
    ├── types.ts
    └── index.ts
```

### Доступ к данным

**Простой уровень** (`lib/data/`):
```typescript
import { getServices, getServiceById } from '@/lib/data/services'
```

**Repository уровень** (`lib/repositories/`):
```typescript
import { getServiceWithRelations, getServicesPaginated } from '@/lib/repositories'
```

---

## Prisma Schema (📋 Планируется для Hi-Fi MVP)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Direction {
  id          String     @id @default(cuid())
  name        String
  shortName   String
  description String?
  iconName    String?
  sortOrder   Int        @default(0)
  status      String     @default("active")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  categories  Category[]
  employees   Employee[]
}

model Category {
  id          String    @id @default(cuid())
  directionId String
  name        String
  description String?
  sortOrder   Int       @default(0)
  status      String    @default("active")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  direction   Direction @relation(fields: [directionId], references: [id])
  services    Service[]
}

model Service {
  id                String   @id @default(cuid())
  categoryId        String
  name              String
  shortName         String?
  slug              String   @unique
  description       String?
  content           Json?    // TipTap content
  status            String   @default("draft")
  version           String   @default("1.0")
  ownerId           String?
  deliverables      String[]
  estimatedDuration String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdById       String?
  updatedById       String?
  
  category          Category           @relation(fields: [categoryId], references: [id])
  owner             Employee?          @relation("ServiceOwner", fields: [ownerId], references: [id])
  products          ServiceProduct[]
  competencies      ServiceCompetency[]
  documents         ServiceDocument[]
  relatedFrom       ServiceRelation[]  @relation("ServiceFrom")
  relatedTo         ServiceRelation[]  @relation("ServiceTo")
}

model Vendor {
  id               String    @id @default(cuid())
  name             String
  website          String?
  partnershipLevel String?
  description      String?
  logoUrl          String?
  status           String    @default("active")
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  products         Product[]
}

model Product {
  id               String   @id @default(cuid())
  vendorId         String
  name             String
  version          String?
  description      String?
  category         String
  documentationUrl String?
  certificates     Json?    // ProductCertificate[]
  status           String   @default("active")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  vendor           Vendor           @relation(fields: [vendorId], references: [id])
  services         ServiceProduct[]
}

model Employee {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  middleName  String?
  email       String   @unique
  phone       String?
  directionId String
  position    String
  avatarUrl   String?
  bio         String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  direction    Direction            @relation(fields: [directionId], references: [id])
  competencies EmployeeCompetency[]
  ownedServices Service[]           @relation("ServiceOwner")
  user         User?
}

model Competency {
  id                  String   @id @default(cuid())
  name                String
  category            String
  description         String?
  issuingOrganization String?
  status              String   @default("active")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  employees           EmployeeCompetency[]
  services            ServiceCompetency[]
}

model EmployeeCompetency {
  id                String   @id @default(cuid())
  employeeId        String
  competencyId      String
  level             String
  certifiedAt       DateTime?
  expiresAt         DateTime?
  certificateNumber String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  employee          Employee   @relation(fields: [employeeId], references: [id])
  competency        Competency @relation(fields: [competencyId], references: [id])
  
  @@unique([employeeId, competencyId])
}

model ServiceCompetency {
  id            String   @id @default(cuid())
  serviceId     String
  competencyId  String
  requiredLevel String
  isRequired    Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  service       Service    @relation(fields: [serviceId], references: [id])
  competency    Competency @relation(fields: [competencyId], references: [id])
  
  @@unique([serviceId, competencyId])
}

model ServiceProduct {
  id        String   @id @default(cuid())
  serviceId String
  productId String
  usage     String?
  createdAt DateTime @default(now())
  
  service   Service  @relation(fields: [serviceId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  
  @@unique([serviceId, productId])
}

model ServiceRelation {
  id               String   @id @default(cuid())
  serviceId        String
  relatedServiceId String
  type             String
  description      String?
  createdAt        DateTime @default(now())
  
  service          Service  @relation("ServiceFrom", fields: [serviceId], references: [id])
  relatedService   Service  @relation("ServiceTo", fields: [relatedServiceId], references: [id])
  
  @@unique([serviceId, relatedServiceId])
}

model Document {
  id          String   @id @default(cuid())
  title       String
  type        String
  fileUrl     String?
  externalUrl String?
  content     String?
  version     String   @default("1.0")
  mimeType    String?
  fileSize    Int?
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  
  services    ServiceDocument[]
}

model ServiceDocument {
  id         String   @id @default(cuid())
  serviceId  String
  documentId String
  section    String?
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  
  service    Service  @relation(fields: [serviceId], references: [id])
  document   Document @relation(fields: [documentId], references: [id])
  
  @@unique([serviceId, documentId])
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  employeeId   String?   @unique
  role         String    @default("employee")
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  employee     Employee? @relation(fields: [employeeId], references: [id])
}
```
