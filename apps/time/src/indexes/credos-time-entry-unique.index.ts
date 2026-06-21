import { defineIndex } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_DATE_FIELD_ID,
  CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_DATE_ID,
  CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_EMPLOYEE_ID,
  CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_PROJECT_ID,
  CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_WORK_TYPE_ID,
  CREDOS_TIME_ENTRY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
} from 'src/constants/universal-identifiers';

// SCOUT-B: уникальный ключ записи трудозатрат — защита factHours от дублей.
//
// ПРОБЛЕМА: до этого индекса два клиента/повторный CSV-импорт создавали несколько
// записей с одним (employee, project, workType, date) → factHours двойной счёт
// (баг заказчика «неверные Факт/Остаток»; DATA_INTEGRITY_AUDIT, вектор «Дубли»).
//
// РЕШЕНИЕ (БД-уровень, defense-in-depth с upsert-гардом /s/time-entry):
//   UNIQUE(employeeId, projectId, workTypeId, date) на credosTimeEntry.
//   Индекс ловит дубли на ВСЕХ путях мутации (REST/GraphQL/грид Twenty/CSV),
//   а не только через /s/time-entry.
//
// ОГРАНИЧЕНИЯ (осознанно):
//   - PG-семантика: NULL != NULL. projectId/workTypeId nullable → строки с NULL
//     в ключе индексом НЕ ловятся. В данных NULL нет (проверено: 0/422), а
//     остаток закрывает upsert-гард в /s/time-entry (резолвит существующую по
//     ключу с IS NULL и обновляет вместо create).
//   - date — DATE_TIME (различает время суток). Уникальность считается по
//     полному значению date. Клиент (недельная сетка) и upsert-гард пишут
//     фиксированное время дня → один день = одно значение → дубли ловятся.
//   - перед apply данные дедуплицированы (scripts/dedup-entries.mjs), иначе
//     создание уникального индекса упадёт на существующих дублях.
//
// fields — массив в порядке колонок индекса (по UUID полей объекта).
export default defineIndex({
  universalIdentifier: CREDOS_TIME_ENTRY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_EMPLOYEE_ID,
      fieldUniversalIdentifier: CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_PROJECT_ID,
      fieldUniversalIdentifier: CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_WORK_TYPE_ID,
      fieldUniversalIdentifier: CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_DATE_ID,
      fieldUniversalIdentifier: CREDOS_TIME_ENTRY_DATE_FIELD_ID,
    },
  ],
});
