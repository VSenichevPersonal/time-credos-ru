import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Раздел-папка сайдбара «Отчёты». UUID локальный — см. folder-planning
// (общий constants/universal-identifiers правит параллельный поток).
export const FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER =
  '2f3739d8-3038-48df-bf8d-e97dd11fdfab';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  icon: 'IconChartPie',
  position: 2,
  type: NavigationMenuItemType.FOLDER,
});
