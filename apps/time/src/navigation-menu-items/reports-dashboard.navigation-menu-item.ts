import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Отчёты» внутри папки «Трудозатраты» -> дашборд утилизации/загрузки.
export default defineNavigationMenuItem({
  universalIdentifier: REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  icon: 'IconChartPie',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
