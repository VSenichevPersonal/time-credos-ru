import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-directories.navigation-menu-item';

// Пункт «Проекты» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_PROJECT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Проекты',
  icon: 'IconFolder',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
});
