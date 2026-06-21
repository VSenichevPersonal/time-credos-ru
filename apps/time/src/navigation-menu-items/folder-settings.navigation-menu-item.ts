import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Раздел-папка сайдбара «Настройки» (страница настроек модуля + объект
// настроек). UUID локальный — см. folder-planning (общий constants правит
// параллельный поток).
export const FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER =
  '2c29553f-df28-4c70-b137-eaf0a603e003';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Настройки',
  icon: 'IconSettings',
  position: 4,
  type: NavigationMenuItemType.FOLDER,
});
