import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  TT_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_BILLING_LINK_PROJECT_FIELD_ID,
  TT_PROJECT_BILLING_LINKS_FIELD_ID,
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Обратная сторона BillingLink.project: связи проекта с 1С (ONE_TO_MANY).
export default defineField({
  universalIdentifier: TT_PROJECT_BILLING_LINKS_FIELD_ID,
  objectUniversalIdentifier: TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'billingLinks',
  label: 'Связи с 1С',
  icon: 'IconLink',
  relationTargetObjectMetadataUniversalIdentifier:
    TT_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TT_BILLING_LINK_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
