import { defineView, ViewFilterOperand, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_APPROVAL_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_APPROVED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_DATE_FIELD_ID,
  CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ENTRY_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  CREDOS_TIME_ENTRY_STATUS_FIELD_ID,
} from 'src/constants/universal-identifiers';
import { ENTRY_STATUS } from 'src/constants/approval';

// View «Согласование»: записи на согласовании (status=SUBMITTED) для руководителя.
// Колонки = дата, часы, проект, работник, статус, дата согласования.
export default defineView({
  universalIdentifier: CREDOS_TIME_APPROVAL_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Согласование',
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconChecks',
  key: ViewKey.INDEX,
  position: 1,
  filters: [
    {
      universalIdentifier: 'd3832872-40d5-44b7-9176-b67aefe9886b',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_STATUS_FIELD_ID,
      operand: ViewFilterOperand.IS,
      value: [ENTRY_STATUS.SUBMITTED],
    },
  ],
  fields: [
    {
      universalIdentifier: '522cda27-3f23-4a21-80ad-919947f9ce93',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_DATE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'f74e5aa7-e808-4df1-8d48-22a223f5b481',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_HOURS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: '205e77bf-d677-4d2c-86cc-b7105a8e47e0',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '606febd2-04b7-4482-b717-2bd497b5349d',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '9fc0517d-f91d-4c36-8098-cf537770bd99',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_STATUS_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'be9a4e7c-2d18-4f5a-9c3b-7e1d6a4c8e21',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_APPROVED_AT_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 150,
    },
  ],
});
