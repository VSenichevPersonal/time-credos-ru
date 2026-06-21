import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Отделы» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отделы',
  icon: 'IconBuilding',
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
