import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Папка-раздел сайдбара «Справочники». UUID локальный (стабильный v4).
export const FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER =
  '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Справочники',
  icon: 'IconBook',
  position: 4,
  type: NavigationMenuItemType.FOLDER,
});
