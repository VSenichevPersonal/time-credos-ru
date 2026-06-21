import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPT_PLAN_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-planning.navigation-menu-item';

// REQ-0012: пункт «Плановые загрузки (без проекта)» внутри папки «Планирование».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_DEPT_PLAN_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Плановые загрузки',
  icon: 'IconCalendarStats',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
});
