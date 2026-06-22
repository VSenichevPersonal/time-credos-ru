import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { FOLDER_CATALOG_NAV_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Папка-раздел сайдбара «Каталог услуг» — логический модуль каталога внутри
// единого app (ADR-0010), отдельно от папок time (Трудозатраты/Планирование/…).
export default defineNavigationMenuItem({
  universalIdentifier: FOLDER_CATALOG_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Каталог услуг',
  icon: 'IconBuildingStore',
  position: 10,
  type: NavigationMenuItemType.FOLDER,
});
