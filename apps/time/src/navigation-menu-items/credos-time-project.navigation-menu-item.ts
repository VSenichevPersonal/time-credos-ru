import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Проекты» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_PROJECT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Проекты',
  icon: 'IconFolder',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
