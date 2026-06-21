import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_TAB_BOOKINGS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_BOOKINGS_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_TIME_ENTRIES_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_RP_W_BOOKINGS_REGISTRY_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  EMPLOYEE_PROJECTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  EMPLOYEE_PROJECTS_RP_TAB_UNIVERSAL_IDENTIFIER,
  EMPLOYEE_PROJECTS_RP_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/front-components/employee-projects.front-component';

// Карточка сотрудника (RECORD_PAGE) — вкладка «Отделы» (REQ-0011 follow-up).
// Зеркало вкладки «Отделы» карточки проекта (REQ-0013 13a): назначения сотрудника
// на отделы в % FTE с датами действия (объект credosTimeEmployeeDepartment,
// обратная связь departmentAssignments).
//  • Виджет 1 (FIELDS на card-view с relation departmentAssignments) — назначения
//    ТЕКУЩЕГО сотрудника инлайн-таблицей (отдел + % FTE + начало/окончание),
//    отфильтрованы по родителю автоматически, с нативной правкой из коробки
//    (CARDS_VIEWS_AUDIT §6). Основной способ ведения отделов сотрудника.
//  • Виджет 2 (RECORD_TABLE на INDEX-view объекта) — полный реестр всех назначений.
// Заголовок карточки = lastName (labelIdentifier сотрудника). Без nav-пункта в
// сайдбаре: управление — из карточки.
export default definePageLayout({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_RECORD_PAGE_UNIVERSAL_IDENTIFIER,
  name: 'Карточка сотрудника',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    // Отделы — назначения сотрудника на отделы (обратная связь departmentAssignments).
    {
      universalIdentifier:
        CREDOS_TIME_EMPLOYEE_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
      title: 'Отделы',
      position: 0,
      icon: 'IconUsersGroup',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
          title: 'Отделы сотрудника (FTE)',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_EMPLOYEE_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER,
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
    // REQ-0016. Трудозатраты — записи сотрудника (обратная связь timeEntries).
    // Кликабельно в карточку записи → проект/этап. «Проекты, где работал» =
    // агрегат записей по проекту → follow-up Dev2 (нет relation employee↔project).
    {
      universalIdentifier:
        CREDOS_TIME_EMPLOYEE_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
      title: 'Трудозатраты',
      position: 1,
      icon: 'IconClock',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
          title: 'Записи трудозатрат',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_EMPLOYEE_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_TIME_ENTRIES_REGISTRY_UNIVERSAL_IDENTIFIER,
          title: 'Все записи трудозатрат (реестр)',
          type: 'RECORD_TABLE',
          gridPosition: { row: 6, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewId: CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // REQ-0016 follow-up. Брони — резервы сотрудника под проекты (обратная связь
    // bookings). FIELDS на card-view с relation bookings (ONE_TO_MANY) → ядро
    // рендерит брони ТЕКУЩЕГО сотрудника инлайн-таблицей (на каких проектах
    // зарезервирован / тип SOFT-HARD / часы / период), кликабельно в карточку
    // брони. Сверка: Timetta — брони видны в карточке ресурса.
    {
      universalIdentifier:
        CREDOS_TIME_EMPLOYEE_RP_TAB_BOOKINGS_UNIVERSAL_IDENTIFIER,
      title: 'Брони',
      position: 2,
      icon: 'IconCalendarPin',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_BOOKINGS_UNIVERSAL_IDENTIFIER,
          title: 'Брони сотрудника',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              CREDOS_TIME_EMPLOYEE_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier:
            CREDOS_TIME_EMPLOYEE_RP_W_BOOKINGS_REGISTRY_UNIVERSAL_IDENTIFIER,
          title: 'Все брони ресурсов (реестр)',
          type: 'RECORD_TABLE',
          gridPosition: { row: 6, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewId: CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    // #5-часть2. Проекты — где сотрудник списывал время (агрегат /s/project-team
    // mode=employee-projects). Закрывает follow-up «Проекты, где работал»
    // (нет relation employee↔project — считается из записей на сервере).
    {
      universalIdentifier: EMPLOYEE_PROJECTS_RP_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Проекты',
      position: 3,
      icon: 'IconFolders',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: EMPLOYEE_PROJECTS_RP_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              EMPLOYEE_PROJECTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
