import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CALENDAR_MONTHLY_NAV_UNIVERSAL_IDENTIFIER,
  CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-directories.navigation-menu-item';

// Пункт «Производственный календарь» (помесячно) в папке «Справочники».
export default defineNavigationMenuItem({
  universalIdentifier: CALENDAR_MONTHLY_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Производственный календарь',
  icon: 'IconCalendarStats',
  position: 6,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
});
