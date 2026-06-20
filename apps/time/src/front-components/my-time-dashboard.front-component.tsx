import { defineFrontComponent } from 'twenty-sdk/define';

import { MyTimeDashboard } from 'src/front-components/my-time/my-time-dashboard';
import { MY_TIME_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Виджет «Мои трудозатраты»: личный кабинет текущего юзера (REQ-0014).
// «Мои часы» (факт/норма/недогруз) + «Мои периоды» (недели со статусами).
export default defineFrontComponent({
  universalIdentifier: MY_TIME_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Мои трудозатраты',
  description: 'Личный кабинет: мои часы (факт/норма/недогруз) и мои периоды со статусами',
  component: MyTimeDashboard,
});
