import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_BILLING_LINKS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_STAGES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_BILLING_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_BUDGET_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_DOCS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_STAGES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_TEAM_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_BILLING_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_BUDGET_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_DOCS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_STAGES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_TEAM_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_TEAM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_BUDGET_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_SUMMARY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_SUMMARY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_SUMMARY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Развитая карточка проекта (RECORD_PAGE) со вкладками — задел на будущее.
// Механика как у карточки записи (CARDS_VIEWS_AUDIT.md): FIELDS-виджет показывает
// поля, привязанные к view. Для каждой вкладки — своя card-view (UNLISTED-по-
// смыслу, без navigationMenuItem, не в сайдбаре).
//  • Обзор — скаляры проекта (FIELDS по card-view «Проект — обзор»).
//  • Трудозатраты/Этапы/Связи с 1С — FIELDS по card-view, где виден relation-
//    field (timeEntries/stages/billingLinks) → ядро рендерит инлайн-таблицу
//    дочерних записей этого проекта (обратная связь ONE_TO_MANY).
//  • Бюджет/Команда — placeholder-вкладки «скоро» (STANDALONE_RICH_TEXT).
//  • Документы — нативный виджет FILES (attachments проекта).
// Заголовок карточки = labelIdentifier проекта (code). Поля name у объекта нет
// (см. CARDS_VIEWS_AUDIT §3); если потребуется name как заголовок — добавить
// TEXT-поле name и переключить labelIdentifier.
export default definePageLayout({
  universalIdentifier: CREDOS_TIME_PROJECT_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  name: 'Карточка проекта',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    // 0. Сводка — ключевые метрики проекта одним экраном (front-component).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_RP_TAB_SUMMARY_UNIVERSAL_IDENTIFIER,
      title: 'Сводка',
      position: 0,
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: CREDOS_TIME_PROJECT_RP_W_SUMMARY_UNIVERSAL_IDENTIFIER,
          title: 'Сводка проекта',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CREDOS_TIME_PROJECT_SUMMARY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // 1. Обзор — реквизиты проекта.
    {
      universalIdentifier:
        CREDOS_TIME_PROJECT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER,
      title: 'Обзор',
      position: 1,
      icon: 'IconFileDescription',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER,
          title: 'Реквизиты проекта',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_PROJECT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: true,
          },
        },
      ],
    },
    // 2. Трудозатраты — записи этого проекта (обратная связь timeEntries).
    {
      universalIdentifier:
        CREDOS_TIME_PROJECT_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
      title: 'Трудозатраты',
      position: 2,
      icon: 'IconClock',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
          title: 'Записи трудозатрат',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_PROJECT_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
      ],
    },
    // 3. Этапы — этапы этого проекта (обратная связь stages).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_RP_TAB_STAGES_UNIVERSAL_IDENTIFIER,
      title: 'Этапы',
      position: 3,
      icon: 'IconListTree',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_STAGES_UNIVERSAL_IDENTIFIER,
          title: 'Этапы проекта',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_PROJECT_CARD_STAGES_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
      ],
    },
    // 4. Связи с 1С — финансовые документы проекта (обратная связь billingLinks).
    {
      universalIdentifier:
        CREDOS_TIME_PROJECT_RP_TAB_BILLING_UNIVERSAL_IDENTIFIER,
      title: 'Связи с 1С',
      position: 4,
      icon: 'IconLink',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_BILLING_UNIVERSAL_IDENTIFIER,
          title: 'Связи с 1С',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_PROJECT_CARD_BILLING_LINKS_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
      ],
    },
    // 5a. Бюджет / план vs факт — front-component (/s/reports byProject).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_RP_TAB_BUDGET_UNIVERSAL_IDENTIFIER,
      title: 'Бюджет',
      position: 5,
      icon: 'IconChartHistogram',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_BUDGET_UNIVERSAL_IDENTIFIER,
          title: 'Бюджет · план vs факт',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CREDOS_TIME_PROJECT_BUDGET_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // 5b. Команда — таблица участников (front-component, агрегат из записей).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_RP_TAB_TEAM_UNIVERSAL_IDENTIFIER,
      title: 'Команда',
      position: 6,
      icon: 'IconUsers',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: CREDOS_TIME_PROJECT_RP_W_TEAM_UNIVERSAL_IDENTIFIER,
          title: 'Команда проекта',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CREDOS_TIME_PROJECT_TEAM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // 5d. Отделы — доли отделов проекта (обратная связь departmentShares).
    // Атрибут перенесён из сайдбара (nav «Доли отделов») в карточку проекта.
    //  • Виджет 1 (FIELDS на card-view с relation departmentShares) — доли
    //    ТЕКУЩЕГО проекта инлайн-таблицей (отдел + плановая доля в часах),
    //    отфильтрованы по родителю автоматически, с нативной правкой
    //    (CARDS_VIEWS_AUDIT §6). Основной способ ведения долей проекта.
    //  • Виджет 2 (RECORD_TABLE на INDEX-view объекта) — полный реестр всех
    //    долей (данные доступны после удаления пункта сайдбара).
    // % от plannedEffort — follow-up (front-component с RestApiClient).
    {
      universalIdentifier:
        CREDOS_TIME_PROJECT_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
      title: 'Отделы',
      position: 7,
      icon: 'IconChartPie',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
          title: 'Доли отделов проекта',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_PROJECT_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER,
          title: 'Все доли отделов (реестр)',
          type: 'RECORD_TABLE',
          gridPosition: { row: 6, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewId: CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // 5e. Документы — нативные attachments проекта (FILES).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_RP_TAB_DOCS_UNIVERSAL_IDENTIFIER,
      title: 'Документы',
      position: 8,
      icon: 'IconPaperclip',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: CREDOS_TIME_PROJECT_RP_W_DOCS_UNIVERSAL_IDENTIFIER,
          title: 'Документы',
          type: 'FILES',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FILES',
          },
        },
      ],
    },
  ],
});
