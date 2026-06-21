import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_CARD_EMPLOYEES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_CARD_PROJECTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_TAB_EMPLOYEES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_TAB_PROJECTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0016. Карточка отдела (RECORD_PAGE) со вкладками-кросс-таблицами.
// Связанность Проект↔Отдел↔Сотрудник: клик по строке → карточка связанной
// сущности (нативный механизм Twenty). Переиспуёт паттерн relation-FIELDS
// card-view (как «Отделы» в карточке проекта/сотрудника, REQ-0013/REQ-0011).
//  • «Сотрудники» — FTE-назначения отдела (relation employeeAssignments,
//    join credosTimeEmployeeDepartment). FIELDS (доли текущего отдела, инлайн +
//    нативная правка) + RECORD_TABLE (полный реестр всех назначений).
//  • «Проекты» — доли отдела в проектах (relation projectShares, join
//    credosTimeProjectDepartment). FIELDS + RECORD_TABLE.
// «Загрузка/ёмкость» и «Записи отдела» (матрица REQ-0016) — агрегаты по периодам
// → follow-up Dev2 (front-component /s/reports; нет прямого relation для кросс-
// таблицы). Заголовок карточки = авто-поле name (у отдела нет TEXT labelIdentifier).
export default definePageLayout({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  name: 'Карточка отдела',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    // 0. Обзор — реквизиты отдела: руководитель (head → Employee) + вышестоящий
    // отдел (parentDepartment self). Нативные relation-поля (выбор+правка из
    // коробки). REQ-0018 follow-up. Иерархия зеркалит Timetta «Входит в».
    {
      universalIdentifier:
        CREDOS_TIME_DEPARTMENT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER,
      title: 'Обзор',
      position: 0,
      icon: 'IconInfoCircle',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_DEPARTMENT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER,
          title: 'Руководитель и иерархия',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 4, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_DEPARTMENT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
      ],
    },
    // 1. Сотрудники — FTE-назначения отдела (обратная связь employeeAssignments).
    {
      universalIdentifier:
        CREDOS_TIME_DEPARTMENT_RP_TAB_EMPLOYEES_UNIVERSAL_IDENTIFIER,
      title: 'Сотрудники',
      position: 1,
      icon: 'IconUsersGroup',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_UNIVERSAL_IDENTIFIER,
          title: 'Сотрудники отдела (FTE)',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_DEPARTMENT_CARD_EMPLOYEES_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_REGISTRY_UNIVERSAL_IDENTIFIER,
          title: 'Все назначения в отделы (реестр)',
          type: 'RECORD_TABLE',
          gridPosition: { row: 6, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewId: CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // 2. Проекты — доли отдела в проектах (обратная связь projectShares).
    {
      universalIdentifier:
        CREDOS_TIME_DEPARTMENT_RP_TAB_PROJECTS_UNIVERSAL_IDENTIFIER,
      title: 'Проекты',
      position: 2,
      icon: 'IconChartPie',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_UNIVERSAL_IDENTIFIER,
          title: 'Проекты отдела (доли)',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_DEPARTMENT_CARD_PROJECTS_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_REGISTRY_UNIVERSAL_IDENTIFIER,
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
  ],
});
