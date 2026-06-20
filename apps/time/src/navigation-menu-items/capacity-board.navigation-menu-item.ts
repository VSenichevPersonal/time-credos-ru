import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CAPACITY_NAV_UNIVERSAL_IDENTIFIER,
  CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Планирование» внутри папки «Трудозатраты» -> страница доски CAPACITY.
export default defineNavigationMenuItem({
  universalIdentifier: CAPACITY_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Планирование',
  icon: 'IconChartBar',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
