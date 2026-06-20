// Доменные типы модуля time. SSOT: string-literal union, коды латиницей (id),
// человекочитаемые ярлыки — в labels.ts. UI всегда показывает русские ярлыки.

// Производственные подразделения (Битрикс/Директум5)
export type DepartmentCode = 'OV' | 'OIB' | 'OPIB' | 'TC' | 'OPR';

// Категория работ (билляность / утилизация)
export type WorkCategory =
  | 'Client'
  | 'Presale'
  | 'Pilot'
  | 'Internal'
  | 'Infrastructure'
  | 'Training';

// Группа вида работ (для аналитики, один справочник credosTimeWorkType)
export type WorkTypeGroup =
  | 'production'
  | 'projectManagement'
  | 'presale'
  | 'meetings'
  | 'training'
  | 'internal';

// Статус записи / периода (согласование)
export type EntryStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

// Тип документа 1С (BillingLink) — синхронизация позже
export type BillingDocType = 'Order' | 'Payment' | 'Act';

// Тип отсутствия (F-D) — вычитается из ёмкости сотрудника при планировании
export type AbsenceType = 'Vacation' | 'Sick' | 'Unpaid' | 'Other';

// Тег записи трудозатрат (W3-2, паттерн Kimai tags) — свободная метка для
// срезов/группировки в отчётах. Контролируемый словарь (MULTI_SELECT), не
// справочник-объект: проще и даёт типобезопасные срезы/цвета.
// Коды в UPPER_SNAKE — совпадают со значениями SELECT (SDK) и option.value:
// ENTRY_TAG_LABELS[value] резолвится напрямую, без приведения регистра.
export type EntryTag =
  | 'OVERTIME'
  | 'URGENT'
  | 'REMOTE'
  | 'ON_SITE'
  | 'REWORK'
  | 'RESEARCH';
