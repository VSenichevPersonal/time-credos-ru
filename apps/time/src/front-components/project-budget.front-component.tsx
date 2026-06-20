import { defineFrontComponent } from 'twenty-sdk/define';

import { ProjectBudget } from 'src/front-components/project-budget/project-budget';
import { CREDOS_TIME_PROJECT_BUDGET_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Виджет вкладки «Бюджет» карточки проекта: план vs факт (/s/reports byProject).
export default defineFrontComponent({
  universalIdentifier: CREDOS_TIME_PROJECT_BUDGET_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Бюджет проекта',
  description: 'План vs факт по часам проекта (прогресс + алерт превышения)',
  component: ProjectBudget,
});
