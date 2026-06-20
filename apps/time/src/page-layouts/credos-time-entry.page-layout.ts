import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_RECORD_PAGE_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_RECORD_PAGE_TAB_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Карточка записи трудозатрат (RECORD_PAGE). Явный FIELDS-виджет, привязанный к
// view «Все записи», гарантирует видимость ключевых полей (дата, часы, ПРОЕКТ,
// вид работ, сотрудник, статус, состав работ) в карточке и форме создания —
// без своей RECORD_PAGE ядро строило дефолт, где проект/вид работ терялись.
// newFieldDefaultVisibility: новые поля объекта показываются автоматически.
export default definePageLayout({
  universalIdentifier: CREDOS_TIME_ENTRY_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  name: 'Карточка записи трудозатрат',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: CREDOS_TIME_ENTRY_RECORD_PAGE_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Запись',
      position: 0,
      icon: 'IconClock',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_ENTRY_RECORD_PAGE_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Поля',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: true,
          },
        },
      ],
    },
  ],
});
