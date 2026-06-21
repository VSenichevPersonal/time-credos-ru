import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  TIMESHEET_T13_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  TIMESHEET_T13_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  TIMESHEET_T13_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  TIMESHEET_T13_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/front-components/timesheet-grid.front-component';

// Страница «Табель Т-13»: один полноэкранный виджет-сетка (CANVAS).
export default definePageLayout({
  universalIdentifier: TIMESHEET_T13_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Табель Т-13',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: TIMESHEET_T13_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Табель Т-13',
      position: 0,
      icon: 'IconTable',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: TIMESHEET_T13_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              TIMESHEET_T13_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
