import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CREDOS_CATALOG_NAV_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_INDEX_VIEW_UNIVERSAL_IDENTIFIER,
  FOLDER_CATALOG_NAV_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Пункт «Услуги» внутри папки «Каталог услуг».
export default defineNavigationMenuItem({
  universalIdentifier: CREDOS_CATALOG_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Услуги',
  icon: 'IconBriefcase',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier:
    CREDOS_CATALOG_SERVICE_INDEX_VIEW_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_CATALOG_NAV_UNIVERSAL_IDENTIFIER,
});
