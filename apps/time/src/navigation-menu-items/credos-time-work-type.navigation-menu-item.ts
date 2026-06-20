import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Виды работ» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_WORK_TYPE_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Виды работ',
  icon: 'IconListCheck',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
