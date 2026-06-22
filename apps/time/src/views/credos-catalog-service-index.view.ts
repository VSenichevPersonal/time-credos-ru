import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_CATALOG_SERVICE_INDEX_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_NAME_FIELD_ID,
  CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_STATUS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Index-view модуля «Каталог услуг» (Phase 0 PoC). Колонки = наименование + статус.
export default defineView({
  universalIdentifier: CREDOS_CATALOG_SERVICE_INDEX_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Услуги',
  objectUniversalIdentifier: CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconBriefcase',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '9e8dbb7e-6948-47ea-af90-e0e93983ad48',
      fieldMetadataUniversalIdentifier: CREDOS_CATALOG_SERVICE_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: '03bd488a-c02b-45db-854d-7b5f716e8965',
      fieldMetadataUniversalIdentifier: CREDOS_CATALOG_SERVICE_STATUS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
  ],
});
