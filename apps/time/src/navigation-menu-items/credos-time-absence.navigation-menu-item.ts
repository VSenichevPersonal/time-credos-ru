import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_ABSENCE_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ABSENCE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-planning.navigation-menu-item';

// Пункт «Отсутствия» внутри папки «Планирование».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_ABSENCE_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отсутствия',
  icon: 'IconBeach',
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_ABSENCE_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
});
