import { defineFrontComponent } from 'twenty-sdk/define';

import { ProjectSummary } from 'src/front-components/project-summary/project-summary';
import { CREDOS_TIME_PROJECT_SUMMARY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Вкладка «Сводка» (1-я) карточки проекта: ключевые метрики одним экраном
// (статус/категория, бюджет план/факт/остаток, команда, этапы, период).
export default defineFrontComponent({
  universalIdentifier: CREDOS_TIME_PROJECT_SUMMARY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Сводка проекта',
  description: 'Ключевые метрики проекта одним экраном',
  component: ProjectSummary,
});
