import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_WORK_TYPE_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-directories.navigation-menu-item';

// Пункт «Виды работ» внутри папки «Справочники».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_WORK_TYPE_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Виды работ',
  icon: 'IconListCheck',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
});
