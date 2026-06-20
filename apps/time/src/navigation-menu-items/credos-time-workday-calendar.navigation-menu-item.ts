import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Произв. календарь» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Произв. календарь',
  icon: 'IconCalendarStats',
  position: 5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier:
    CREDOS_TIME_WORKDAY_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
