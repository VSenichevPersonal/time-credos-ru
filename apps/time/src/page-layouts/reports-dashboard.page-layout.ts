import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  REPORTS_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Страница «Отчёты»: один полноэкранный виджет-дашборд (CANVAS).
export default definePageLayout({
  universalIdentifier: REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: REPORTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Отчёты',
      position: 0,
      icon: 'IconChartPie',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: REPORTS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              REPORTS_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
