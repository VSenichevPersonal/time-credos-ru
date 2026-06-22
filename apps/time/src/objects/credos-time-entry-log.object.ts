import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { ENTRY_LOG_ACTION_OPTIONS } from 'src/constants/select-options';
import {
  CREDOS_TIME_ENTRY_LOG_ACTION_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_ACTOR_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_ENTRY_DATE_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_ENTRY_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_LOGGED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_NEW_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_NEW_STATUS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_LOG_OLD_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_OLD_STATUS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOGS_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// AUDIT-LOG (MVP-гибрид, AUDIT_LOG_PERIOD_LOCKDOWN.md §3): узкий журнал изменений
// трудозатрат. 1 строка = одно действие над записью (create/update часов/delete/смена
// статуса) с фиксацией «кто/когда/что» (diff). НЕ полный per-field change-log (как
// Timetta) — закрывает 90% аудиторской потребности РФ-табеля при минимуме записей.
//
// Создание/удаление записи трудозатрат частично покрыто нативными createdBy/createdAt
// ядра (доступны на любом объекте Twenty); этот лог даёт diff правок часов, удаления и
// смены статуса — то, чего ядро НЕ хранит (updatedAt без old→new). MVP пишет строку и
// на create — для единого читаемого реестра действий в одном месте.
//
// [[twenty-sdk-apply-gotchas]]: имена полей НЕ резервные (actor/action/loggedAt вместо
// who/createdBy/at/role). labelIdentifier — на actor (TEXT), НЕ на name и НЕ на SELECT
// (searchVector/labelIdentifier требует searchable TEXT-тип; SELECT-action не годится →
// INVALID_OBJECT_INPUT). entry MANY_TO_ONE CASCADE: лог — производная запись, без entry смысла не
// имеет (история диффа уже снята в самих строках; сирот-логов быть не должно — в
// отличие от entry, который RESTRICT как самостоятельная ось учёта).
//
// Техн.объект: index-view есть (SDK-pitfall + админ-аудит по прямой ссылке), nav-item
// НАМЕРЕННО скрыт (как plan-slot) — журнал не для повседневной навигации сотрудника;
// исключён из nav-guard через TECHNICAL_VIEWS (schema-guard.test.ts).
export default defineObject({
  universalIdentifier: CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeEntryLog',
  namePlural: 'credosTimeEntryLogs',
  labelSingular: 'Запись журнала трудозатрат',
  labelPlural: 'Журнал изменений трудозатрат',
  description:
    'Журнал изменений записей трудозатрат (кто/когда/что: create/update/delete/status)',
  icon: 'IconHistory',
  // labelIdentifier = actor (TEXT) — заголовок строки лога. SELECT-action нельзя
  // (searchVector требует searchable TEXT-тип). actor = «кто» (employeeId), осмысленный
  // заголовок строки журнала; действие/дифф читаются в колонках.
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_LOG_ACTOR_FIELD_ID,
  fields: [
    // Тип действия (labelIdentifier). SELECT: CREATE|UPDATE|DELETE|STATUS.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_ACTION_FIELD_ID,
      name: 'action',
      type: FieldType.SELECT,
      label: 'Действие',
      icon: 'IconActivity',
      options: ENTRY_LOG_ACTION_OPTIONS,
    },
    // Кто совершил действие (server-truth resolveActor → employeeId). TEXT, а не
    // RELATION: переживает удаление сотрудника (история не теряется) и не плодит
    // FK-зависимостей лога. nullable — при недоступной server-identity (деградация
    // resolveActor=null) лог всё равно пишется с пустым actor (действие важнее «кто»).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_ACTOR_FIELD_ID,
      name: 'actor',
      type: FieldType.TEXT,
      label: 'Кто (актор)',
      icon: 'IconUser',
      isNullable: true,
      defaultValue: null,
      description: 'Сотрудник-актор (resolveActor, server-truth). Пусто = личность не резолвлена.',
    },
    // Часы ДО действия (nullable: на create — пусто; на update/delete/status — прежнее).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_OLD_HOURS_FIELD_ID,
      name: 'oldHours',
      type: FieldType.NUMBER,
      label: 'Часы до',
      icon: 'IconClockMinus',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // Часы ПОСЛЕ действия (nullable: на delete — пусто; на create/update — новое).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_NEW_HOURS_FIELD_ID,
      name: 'newHours',
      type: FieldType.NUMBER,
      label: 'Часы после',
      icon: 'IconClockPlus',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // Статус ДО / ПОСЛЕ (заполняются на action=STATUS). TEXT (а не SELECT) —
    // лог хранит «снимок» строки статуса как был, без связности со справочником.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_OLD_STATUS_FIELD_ID,
      name: 'oldStatus',
      type: FieldType.TEXT,
      label: 'Статус до',
      icon: 'IconProgress',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_NEW_STATUS_FIELD_ID,
      name: 'newStatus',
      type: FieldType.TEXT,
      label: 'Статус после',
      icon: 'IconProgressCheck',
      isNullable: true,
      defaultValue: null,
    },
    // Дата записи трудозатрат (день, к которому относится действие) — снимок для
    // фильтрации лога по периоду без джойна на entry (entry может быть удалён → CASCADE).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_ENTRY_DATE_FIELD_ID,
      name: 'entryDate',
      type: FieldType.DATE_TIME,
      label: 'Дата записи',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    // Когда совершено действие (метка времени лога). Заполняется на стороне logic.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_LOGGED_AT_FIELD_ID,
      name: 'loggedAt',
      type: FieldType.DATE_TIME,
      label: 'Когда',
      icon: 'IconClock',
      defaultValue: 'now',
    },
    // EntryLog.entry -> Entry.logs (MANY_TO_ONE, onDelete CASCADE).
    // Лог производный: при удалении записи трудозатрат снос связанных логов уместен
    // (diff уже отражён в строках, сирот-логов без entry не держим).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_LOG_ENTRY_FIELD_ID,
      name: 'entry',
      type: FieldType.RELATION,
      label: 'Запись трудозатрат',
      icon: 'IconClock',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_LOGS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'entryId',
      },
    },
  ],
});
