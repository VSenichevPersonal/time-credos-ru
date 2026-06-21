import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_SETTINGS_OBJ_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-settings.navigation-menu-item';

// REQ-0019 — пункт index-view singleton-настроек в папке «Настройки».
// Нужен, чтобы объект credosTimeSettings был доступен (Common Pitfalls: view без
// nav-item не виден в сайдбаре). Основное управление — отдельная страница
// «Настройки» (PAGE_LAYOUT, position 0); этот пункт — для контроля записи.
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_SETTINGS_OBJ_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Настройки модуля',
  icon: 'IconAdjustments',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CREDOS_TIME_SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
});
