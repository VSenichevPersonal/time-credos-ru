import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Раздел-папка сайдбара «Планирование». Дочерние пункты (Планирование,
// Плановые загрузки, Брони ресурсов, Отсутствия) ссылаются на неё через
// folderUniversalIdentifier. UUID локальный — общий constants/universal-identifiers
// параллельно правит ux-polish-поток (REQ-0016), не трогаем (Hot-file коллизии).
export const FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER =
  'aa852263-f002-4b05-97df-1620a46f87c6';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_PLANNING_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Планирование',
  icon: 'IconCalendarStats',
  position: 1,
  type: NavigationMenuItemType.FOLDER,
});
