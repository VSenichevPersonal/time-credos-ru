import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Папка-раздел сайдбара «Настройки». UUID локальный (стабильный v4).
export const FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER =
  '3d4e5f6a-7b8c-4d9e-8f0a-2b3c4d5e6f7a';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_SETTINGS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Настройки',
  icon: 'IconSettings',
  position: 5,
  type: NavigationMenuItemType.FOLDER,
});
