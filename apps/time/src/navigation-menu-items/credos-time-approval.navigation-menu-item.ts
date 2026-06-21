import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_APPROVAL_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_APPROVAL_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Согласование» внутри папки «Таймшиты» (для руководителя —
// список записей, ожидающих согласования).
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_APPROVAL_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Согласование',
  icon: 'IconChecks',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_APPROVAL_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
