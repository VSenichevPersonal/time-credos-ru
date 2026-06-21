import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/folder-reports.navigation-menu-item';
import {
  TIMESHEET_T13_NAV_UNIVERSAL_IDENTIFIER,
  TIMESHEET_T13_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/front-components/timesheet-grid.front-component';

// Пункт «Табель Т-13» в папке «Трудозатраты». NB: при nav-консолидации
// (sidebar-reorg) arch перенесёт в группу «Отчёты» (folderUniversalIdentifier).
// Пока цепляюсь за стабильную CREDOS_TIME_FOLDER, чтобы не зависеть от in-progress
// folder-reports параллельного потока. position 8 — после «Отчёты».
export default defineNavigationMenuItem({
  universalIdentifier: TIMESHEET_T13_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Табель Т-13',
  icon: 'IconTable',
  position: 8,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: TIMESHEET_T13_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  folderUniversalIdentifier: FOLDER_REPORTS_NAV_UNIVERSAL_IDENTIFIER,
});
