import { defineFrontComponent } from 'twenty-sdk/define';

import { WeeklyGrid } from 'src/front-components/grid/weekly-grid';
import {
  APP_DISPLAY_NAME,
  MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Главный виджет «Трудозатраты»: недельная сетка ввода (заменил заглушку).
// Идентификатор сохранён — привязка к существующему page-layout/виджету.

export default defineFrontComponent({
  universalIdentifier: MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: APP_DISPLAY_NAME,
  description: `${APP_DISPLAY_NAME}: недельная сетка трудозатрат`,
  component: WeeklyGrid,
});
