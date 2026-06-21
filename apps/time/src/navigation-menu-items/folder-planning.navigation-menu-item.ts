import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Папка-раздел сайдбара «Планирование». UUID локальный (стабильный v4).
export const FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER =
  '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Планирование',
  icon: 'IconCalendarStats',
  position: 2,
  type: NavigationMenuItemType.FOLDER,
});
