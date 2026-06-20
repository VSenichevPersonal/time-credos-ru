import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Записи» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_ENTRY_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Записи',
  icon: 'IconClock',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
