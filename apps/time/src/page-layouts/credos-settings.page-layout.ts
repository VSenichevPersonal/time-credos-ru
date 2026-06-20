import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CREDOS_TIME_SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Страница «Настройки»: один полноэкранный виджет с тем же settings front-component,
// что и подраздел Settings (PATCH отделов и справочников). Вынесена отдельной
// STANDALONE_PAGE, т.к. settingsCustomTab на 2.14 не рендерится сервером.
export default definePageLayout({
  universalIdentifier: CREDOS_TIME_SETTINGS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Настройки',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Настройки',
      position: 0,
      icon: 'IconSettings',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: CREDOS_TIME_SETTINGS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CREDOS_TIME_SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
