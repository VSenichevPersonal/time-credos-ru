import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CAPACITY_NAV_UNIVERSAL_IDENTIFIER,
  CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-planning.navigation-menu-item';

// Пункт «Планирование» внутри папки «Трудозатраты» -> страница доски CAPACITY.
export default defineNavigationMenuItem({
  universalIdentifier: CAPACITY_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Планирование',
  icon: 'IconChartBar',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
});
