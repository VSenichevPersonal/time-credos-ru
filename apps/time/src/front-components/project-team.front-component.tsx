import { defineFrontComponent } from 'twenty-sdk/define';

import { ProjectTeam } from 'src/front-components/project-team/project-team';
import { CREDOS_TIME_PROJECT_TEAM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Виджет вкладки «Команда» карточки проекта: таблица участников (сотрудники,
// списывавшие время) с суммарными часами. Заменяет placeholder STANDALONE_RICH_TEXT.
export default defineFrontComponent({
  universalIdentifier: CREDOS_TIME_PROJECT_TEAM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Команда проекта',
  description: 'Сотрудники, списывавшие время на проект, с суммарными часами',
  component: ProjectTeam,
});
