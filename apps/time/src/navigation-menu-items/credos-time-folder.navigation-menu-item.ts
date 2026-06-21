import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Раздел-папка сайдбара «Ввод времени» (таймшит-сетка, мои таймшиты, согласование).
// Дочерние VIEW-пункты ссылаются на неё через folderUniversalIdentifier.
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Ввод времени',
  icon: 'IconClock',
  position: 0,
  type: NavigationMenuItemType.FOLDER,
});
