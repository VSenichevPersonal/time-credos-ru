import { defineFrontComponent } from 'twenty-sdk/define';

import { CapacityBoard } from 'src/front-components/capacity/capacity-board';
import { CAPACITY_BOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Виджет «Планирование»: доска загрузки отделов (capacity) с 2 режимами.
export default defineFrontComponent({
  universalIdentifier: CAPACITY_BOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Планирование загрузки',
  description: 'Доска планирования загрузки отделов (capacity)',
  component: CapacityBoard,
});
