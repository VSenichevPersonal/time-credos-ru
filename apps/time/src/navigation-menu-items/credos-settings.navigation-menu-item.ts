import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-settings.navigation-menu-item';

// Пункт «Настройки» в конце папки «Трудозатраты» -> страница конфигурации
// модуля (отделы, справочники). Тот же front-component, что и подраздел Settings.
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Настройки',
  icon: 'IconSettings',
  position: 11,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: CREDOS_TIME_SETTINGS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
});
