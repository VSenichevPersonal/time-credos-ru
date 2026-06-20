import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { BILLING_DOC_TYPE_OPTIONS } from 'src/constants/select-options';
import {
  TT_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_BILLING_LINK_PROJECT_FIELD_ID,
  TT_PROJECT_BILLING_LINKS_FIELD_ID,
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Связь с 1С — junction проект↔документ 1С (M:N задел). Синхронизация позже.
export default defineObject({
  universalIdentifier: TT_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'ttBillingLink',
  namePlural: 'ttBillingLinks',
  labelSingular: 'Связь с 1С',
  labelPlural: 'Связи с 1С',
  description: 'Связь проекта с финансовым документом 1С',
  icon: 'IconLink',
  fields: [
    {
      universalIdentifier: '101c85a2-bdea-488d-b5fd-54154c4b110f',
      name: 'externalSystem',
      type: FieldType.TEXT,
      label: 'Внешняя система',
      icon: 'IconDatabase',
      defaultValue: "'1С'",
    },
    {
      universalIdentifier: '18e4cb45-e0da-449f-93bf-6a17d2f2990e',
      name: 'docType',
      type: FieldType.SELECT,
      label: 'Тип документа',
      icon: 'IconFileInvoice',
      options: BILLING_DOC_TYPE_OPTIONS,
    },
    {
      universalIdentifier: '09b1ac31-b746-49b5-9125-06e9d6446c65',
      name: 'externalId',
      type: FieldType.TEXT,
      label: 'Внешний ID',
      icon: 'IconId',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '13016dc3-ea4b-4bb5-a16c-6ad570f65590',
      name: 'number',
      type: FieldType.TEXT,
      label: 'Номер документа',
      icon: 'IconHash',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: 'e64d1709-b946-4b7d-9ebb-9dc35336efc6',
      name: 'date',
      type: FieldType.DATE_TIME,
      label: 'Дата документа',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '39033db2-262f-4093-bb4e-f8e11d62e10f',
      name: 'amount',
      type: FieldType.NUMBER,
      label: 'Сумма',
      icon: 'IconCurrencyRubel',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // BillingLink.project -> Project.billingLinks (MANY_TO_ONE).
    {
      universalIdentifier: TT_BILLING_LINK_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_PROJECT_BILLING_LINKS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
  ],
});
