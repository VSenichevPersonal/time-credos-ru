import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_DEPARTMENT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_PLANNED_EFFORT_SHARE_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0013 13a (консолидация): INDEX-view объекта credosTimeProjectDepartment.
// Раньше — пункт сайдбара «Доли отделов»; теперь атрибут перенесён в карточку
// проекта (вкладка «Отделы», relation departmentShares). Эта view убрана из
// сайдбара (nav-item удалён) и встроена реестром-вкладкой карточки проекта
// (имя файла `-card-` → schema-guard не требует nav, требует привязку к layout).
// Колонки = проект, отдел, плановая доля (часы) — полный реестр всех долей.
export default defineView({
  universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Доли отделов в проектах',
  objectUniversalIdentifier:
    CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconChartPie',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: 'b5dd1815-5597-440e-99e2-fc9d2a17e277',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: 'ddb02c74-e74b-4889-8bcc-938d618dfbf3',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_DEPARTMENT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '87b90b18-78aa-4ba8-ba11-4a421911bba4',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_PLANNED_EFFORT_SHARE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
