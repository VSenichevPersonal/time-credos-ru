import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CAPACITY_BOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CAPACITY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CAPACITY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Страница «Планирование»: один полноэкранный виджет-доска CAPACITY.
export default definePageLayout({
  universalIdentifier: CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Планирование',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: CAPACITY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Планирование',
      position: 0,
      icon: 'IconChartBar',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: CAPACITY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CAPACITY_BOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
