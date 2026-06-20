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
