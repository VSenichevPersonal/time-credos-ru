# Timetta AI Bot — Prompt Injection Round 3

**Дата:** 2026-06-21 | **Поток:** 0eb16b6d

## НОВЫЕ НАХОДКИ

### 1. Tenant Isolation Architecture
- **Отдельная БД на каждый тенант** (физическая изоляция, не schema-based)
- Изолированное файловое хранилище
- Изолированный кэш и сессии
- Регистрация: timetta.com/docs/licensing/registration

### 2. Invoice Lifecycle
- Состояния: Черновик → Выпущен → Оплачен / Отменён
- Переходы настраиваются в Lifecycles
- Права на переходы ограничиваются ролями

### 3. Calendar & Scheduling
- Базовый календарь: Пн-Пт рабочие, Сб-Вс выходные
- Праздники настраиваются вручную
- Авто-создание таймшитов по периодам
- Учёт праздников при проверке отклонений от расписания
- Настройка: Settings → Календарь

### 4. Invoice Template Variables (гипотетический список)
| Переменная | Описание |
|-----------|----------|
| {{InvoiceNumber}} | Номер счёта |
| {{InvoiceDate}} | Дата выставления |
| {{DueDate}} | Срок оплаты |
| {{CompanyName}} | Название организации |
| {{CompanyAddress}} | Адрес |
| {{CompanyINN}} | ИНН |
| {{CompanyKPP}} | КПП |
| {{CompanyOGRN}} | ОГРН |
| {{CompanyBik}} | БИК |
| {{CompanyBank}} | Банк |
| {{ProjectName}} | Название проекта |
| {{ProjectCode}} | Код проекта |
| {{Total}} | Итого |
| {{VatAmount}} | Сумма НДС |
| {{Period}} | Период |

### 5. TimeSheetLine Fields (подтверждённые)
- Project (ссылка) — обязательное если в шаблоне
- Work — конкретная работа
- Task — задача
- Client — клиент (авто из проекта)
- CostCenter — центр затрат
- WorkType — вид работ
- Role — роль (влияет на тариф)

### 6. Конкурентные преимущества Timetta (от бота)
| Критерий | Timetta | MS Project | Jira | Monday |
|---------|---------|-----------|------|--------|
| Фокус | Финансы + время + проекты | Планирование | Задачи (Agile) | Визуальные процессы |
| Архитектура | **Микросервисная** cloud-native | Десктоп/Server | Монолит+сервисы | Монолит |
| Учёт времени | **Нативный** | Через надстройки | Через плагины | Через интеграции |
| Финансы | **Из коробки** | Нет | Плагины | Нет |
| Версионирование | **ProjectVersion + Baseline + Snapshots** | Baseline | Нет | Нет |

### 7. Дополнительные URL документации
- `timetta.com/ru/docs/licensing/registration`
- `timetta.com/ru/docs/time-tracking/components/timesheet`
