import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_STAGE_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-directories.navigation-menu-item';

// Пункт «Этапы» внутри папки «Справочники».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_STAGE_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Этапы',
  icon: 'IconListTree',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
});
