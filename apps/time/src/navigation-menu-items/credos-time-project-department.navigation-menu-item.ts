import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0013 13a: пункт «Доли отделов в проектах» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Доли отделов',
  icon: 'IconChartPie',
  position: 9,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
