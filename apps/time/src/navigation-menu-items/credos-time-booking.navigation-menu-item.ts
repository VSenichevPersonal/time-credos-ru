import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_BOOKING_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0004 Часть C: пункт «Брони ресурсов» внутри папки «Трудозатраты».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_BOOKING_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Брони ресурсов',
  icon: 'IconCalendarPin',
  position: 12,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
