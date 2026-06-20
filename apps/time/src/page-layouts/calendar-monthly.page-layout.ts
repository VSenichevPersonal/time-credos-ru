import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CALENDAR_MONTHLY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CALENDAR_MONTHLY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CALENDAR_MONTHLY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Страница «Производственный календарь»: один полноэкранный виджет помесячного
// агрегата (5/2).
export default definePageLayout({
  universalIdentifier: CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Производственный календарь',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: CALENDAR_MONTHLY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Производственный календарь',
      position: 0,
      icon: 'IconCalendarStats',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: CALENDAR_MONTHLY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CALENDAR_MONTHLY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
