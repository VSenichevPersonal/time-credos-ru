import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

// Раздел-папка сайдбара «Справочники» (проекты, виды работ, этапы, отделы,
// сотрудники, производственный календарь, связи с 1С). UUID локальный —
// см. folder-planning (общий constants правит параллельный поток).
export const FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER =
  '5de0992c-3ee8-4c98-894a-bf9fae322703';

export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_DIRECTORIES_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Справочники',
  icon: 'IconBook',
  position: 3,
  type: NavigationMenuItemType.FOLDER,
});
