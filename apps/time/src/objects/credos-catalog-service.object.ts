import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CREDOS_CATALOG_SERVICE_NAME_FIELD_ID,
  CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_SLUG_FIELD_ID,
  CREDOS_CATALOG_SERVICE_STATUS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Услуга каталога — PoC-объект Phase 0 модуля «Каталог услуг» (Knowledge Hub).
// Модуль каталога живёт в ТОМ ЖЕ app, что и time (ADR-0010): cross-app кастом-
// ссылки в Twenty 2.14 не работают. Связь Service.owner → credosTimeEmployee —
// intra-app relation в отдельном field-файле (credos-catalog-service-owner.field.ts).
export default defineObject({
  universalIdentifier: CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosCatalogService',
  namePlural: 'credosCatalogServices',
  labelSingular: 'Услуга',
  labelPlural: 'Услуги',
  description: 'Каталог производственных услуг Кредо-С',
  icon: 'IconBriefcase',
  // labelIdentifier = title (TEXT). Поле создано предыдущим деплоем — грабля
  // «labelIdentifier к полю того же sync» неактуальна (two-phase соблюдён).
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_CATALOG_SERVICE_NAME_FIELD_ID,
  fields: [
    // Наименование услуги. Слаг `title`, НЕ `name` — `name` зарезервировано платформой.
    {
      universalIdentifier: CREDOS_CATALOG_SERVICE_NAME_FIELD_ID,
      name: 'title',
      type: FieldType.TEXT,
      label: 'Наименование',
      icon: 'IconBriefcase',
    },
    // ЧПУ-идентификатор. Слаг `serviceSlug`, НЕ `slug` — `slug` зарезервировано.
    {
      universalIdentifier: CREDOS_CATALOG_SERVICE_SLUG_FIELD_ID,
      name: 'serviceSlug',
      type: FieldType.TEXT,
      label: 'Слаг',
      icon: 'IconLink',
    },
    // Статус публикации. Слаг `serviceStatus`, НЕ `status` — `status` зарезервировано.
    // SELECT-опции: label БЕЗ запятых (SDK-грабля — запятая ломает парсинг).
    {
      universalIdentifier: CREDOS_CATALOG_SERVICE_STATUS_FIELD_ID,
      name: 'serviceStatus',
      type: FieldType.SELECT,
      label: 'Статус',
      icon: 'IconStatusChange',
      options: [
        { value: 'DRAFT', label: 'Черновик', position: 0, color: 'gray' },
        { value: 'ACTIVE', label: 'Активна', position: 1, color: 'green' },
        { value: 'ARCHIVED', label: 'В архиве', position: 2, color: 'orange' },
      ],
    },
  ],
});
