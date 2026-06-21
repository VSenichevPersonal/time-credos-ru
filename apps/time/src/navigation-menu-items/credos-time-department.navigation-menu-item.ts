import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-directories.navigation-menu-item';

// Пункт «Отделы» внутри папки «Справочники».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отделы',
  icon: 'IconBuilding',
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
});
