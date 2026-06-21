import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_BILLING_LINK_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BILLING_LINK_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Связи с 1С» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_BILLING_LINK_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Связи с 1С',
  icon: 'IconLink',
  position: 7,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_BILLING_LINK_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
