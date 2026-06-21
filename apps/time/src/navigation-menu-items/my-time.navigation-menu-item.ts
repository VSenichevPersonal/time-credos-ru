import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  MY_TIME_NAV_UNIVERSAL_IDENTIFIER,
  MY_TIME_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Мои трудозатраты» в папке «Трудозатраты» (REQ-0014): личный кабинет
// текущего юзера. Рядом с «Записи» — связка «внёс → посмотрел свои часы/периоды».
export default defineNavigationMenuItem({
  universalIdentifier: MY_TIME_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Мои трудозатраты',
  icon: 'IconUserClock',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: MY_TIME_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
});
