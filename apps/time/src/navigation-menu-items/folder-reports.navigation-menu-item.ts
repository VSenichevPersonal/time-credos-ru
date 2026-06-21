import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Папка-раздел сайдбара «Отчёты». UUID локальный (стабильный v4).
export const FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER =
  '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  icon: 'IconChartPie',
  position: 3,
  type: NavigationMenuItemType.FOLDER,
});
