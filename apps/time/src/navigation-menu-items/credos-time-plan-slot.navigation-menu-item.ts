import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_PLAN_SLOT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PLAN_SLOT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-planning.navigation-menu-item';

// WI-47: пункт «Плановое распределение» внутри папки «Планирование».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_PLAN_SLOT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Плановое распределение',
  icon: 'IconCalendarMonth',
  position: 9,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_PLAN_SLOT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
});
