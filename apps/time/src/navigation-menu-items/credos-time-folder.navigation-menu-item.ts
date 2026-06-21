import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Раздел-папка сайдбара «Таймшиты» (бывш. «Трудозатраты»). Дочерние пункты
// (Все записи / таймшит-сетка, Мои таймшиты, Согласование) ссылаются на неё
// через folderUniversalIdentifier. Остальные группы — отдельные FOLDER-файлы:
// folder-planning, folder-reports, folder-directories, folder-settings.
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Ввод времени',
  icon: 'IconClock',
  position: 0,
  type: NavigationMenuItemType.FOLDER,
});
