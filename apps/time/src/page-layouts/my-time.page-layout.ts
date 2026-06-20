import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  MY_TIME_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  MY_TIME_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  MY_TIME_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MY_TIME_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Страница «Мои трудозатраты» (REQ-0014): один полноэкранный виджет-кабинет
// текущего юзера (CANVAS). Паттерн «Отчёты».
export default definePageLayout({
  universalIdentifier: MY_TIME_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Мои трудозатраты',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: MY_TIME_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Мои трудозатраты',
      position: 0,
      icon: 'IconUserClock',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: MY_TIME_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              MY_TIME_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
