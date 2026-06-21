import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Этапы» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_STAGE_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Этапы',
  icon: 'IconListTree',
  position: 6,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
