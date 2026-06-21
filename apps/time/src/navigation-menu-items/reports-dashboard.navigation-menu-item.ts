import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-reports.navigation-menu-item';

// Пункт «Отчёты» внутри папки «Трудозатраты» -> дашборд утилизации/загрузки.
export default defineNavigationMenuItem({
  universalIdentifier: REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  icon: 'IconChartPie',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER,
});
