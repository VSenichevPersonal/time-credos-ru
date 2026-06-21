import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CALENDAR_MONTHLY_NAV_UNIVERSAL_IDENTIFIER,
  CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Производственный календарь» (помесячно) в папке «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CALENDAR_MONTHLY_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Производственный календарь',
  icon: 'IconCalendarStats',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
