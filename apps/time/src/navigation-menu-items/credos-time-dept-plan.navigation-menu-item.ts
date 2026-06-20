import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPT_PLAN_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0012: пункт «Плановые загрузки (без проекта)» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_DEPT_PLAN_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Плановые загрузки',
  icon: 'IconCalendarStats',
  position: 8,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
