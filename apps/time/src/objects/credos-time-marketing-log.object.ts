import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_MARKETING_LOG_ACTOR_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_CHANGED_AT_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_FIELD_NAME_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_NEW_VALUE_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_MARKETING_LOG_OLD_VALUE_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// MARKETING-LOG (per-field аудит маркетинг-полей проекта): 1 строка = одно изменённое
// МАРКЕТИНГ-поле проекта (кто/когда/старое→новое). Закрывает потребность долгого LTV
// клиента: разрешения NDA/публикации меняются годами, нужно знать «кто снял NDA /
// разрешил публикацию когда». Узкий лог ТОЛЬКО маркетинг-полей (не всех полей проекта
// — [[keep-it-simple]]); whole-record «кто последним менял» закрыт нативным updatedBy
// ядра в card-view.
//
// Пишется database-event триггером credosTimeProject.updated (см. project-marketing-log-
// updated.logic.ts) по каждому изменённому маркетинг-полю. actor — server-truth по
// event.userWorkspaceId → employee; деградация actor=null лог НЕ валит.
//
// [[twenty-sdk-apply-gotchas]]: имена полей НЕ резервные (fieldName/oldValue/newValue/
// actor/changedAt — не name/role/createdBy). labelIdentifier — на fieldName (TEXT,
// searchable; searchVector требует searchable TEXT-тип). project MANY_TO_ONE CASCADE:
// лог производный — без проекта смысла не имеет (сирот-логов не держим).
//
// Техн.объект: index-view есть (SDK-pitfall + админ-аудит по прямой ссылке), nav-item
// НАМЕРЕННО скрыт (как entry-log) — журнал не для повседневной навигации; исключён из
// nav-guard через TECHNICAL_VIEWS (schema-guard.test.ts).
export default defineObject({
  universalIdentifier: CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeMarketingLog',
  namePlural: 'credosTimeMarketingLogs',
  labelSingular: 'Запись журнала маркетинга',
  labelPlural: 'Журнал изменений маркетинга',
  description:
    'Журнал изменений маркетинг-полей проекта (кто/когда/старое→новое по каждому полю)',
  icon: 'IconHistory',
  // labelIdentifier = fieldName (TEXT, searchable) — заголовок строки лога «какое поле».
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_MARKETING_LOG_FIELD_NAME_FIELD_ID,
  fields: [
    // Какое маркетинг-поле изменилось (имя поля проекта). labelIdentifier.
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_FIELD_NAME_FIELD_ID,
      name: 'fieldName',
      type: FieldType.TEXT,
      label: 'Поле',
      icon: 'IconForms',
      description: 'Имя изменённого маркетинг-поля проекта (ndaLevel/isPublished/...)',
    },
    // Значение ДО изменения (снимок-строка). nullable: поле могло быть пустым.
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_OLD_VALUE_FIELD_ID,
      name: 'oldValue',
      type: FieldType.TEXT,
      label: 'Было',
      icon: 'IconArrowBackUp',
      isNullable: true,
      defaultValue: null,
    },
    // Значение ПОСЛЕ изменения (снимок-строка). nullable: поле могло стать пустым.
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_NEW_VALUE_FIELD_ID,
      name: 'newValue',
      type: FieldType.TEXT,
      label: 'Стало',
      icon: 'IconArrowForwardUp',
      isNullable: true,
      defaultValue: null,
    },
    // Кто изменил (server-truth по event.userWorkspaceId → employeeId). TEXT, а не
    // RELATION: переживает удаление сотрудника (история не теряется), без FK-зависимостей.
    // nullable — при недоступной server-identity (деградация) лог пишется с пустым actor.
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_ACTOR_FIELD_ID,
      name: 'actor',
      type: FieldType.TEXT,
      label: 'Кто (актор)',
      icon: 'IconUser',
      isNullable: true,
      defaultValue: null,
      description: 'Сотрудник-актор (server-truth по userWorkspaceId). Пусто = личность не резолвлена.',
    },
    // Когда изменено (метка времени лога).
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_CHANGED_AT_FIELD_ID,
      name: 'changedAt',
      type: FieldType.DATE_TIME,
      label: 'Когда',
      icon: 'IconClock',
      defaultValue: 'now',
    },
    // MarketingLog.project -> Project.marketingLogs (MANY_TO_ONE, onDelete CASCADE).
    // Лог производный: при удалении проекта снос связанных логов уместен (сирот не держим).
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconBriefcase',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
  ],
});
