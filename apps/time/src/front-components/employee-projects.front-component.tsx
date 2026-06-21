import { defineFrontComponent } from 'twenty-sdk/define';

import { EmployeeProjects } from 'src/front-components/project-team/employee-projects';

// Вкладка «Проекты» карточки сотрудника (#5-часть2): проекты, где сотрудник
// списывал время. Данные /s/project-team (mode=employee-projects). UUID локально
// (constants.ts — hot-file параллельных потоков); page-layout импортирует отсюда.
export const EMPLOYEE_PROJECTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '1e2f3a4b-5c6d-4e7f-9a8b-1c2d3e4f5a61';
export const EMPLOYEE_PROJECTS_RP_TAB_UNIVERSAL_IDENTIFIER =
  '3a4b5c6d-7e8f-4091-9cad-3e4f5a6b7c83';
export const EMPLOYEE_PROJECTS_RP_WIDGET_UNIVERSAL_IDENTIFIER =
  '2f3a4b5c-6d7e-4f80-8b9c-2d3e4f5a6b72';

export default defineFrontComponent({
  universalIdentifier: EMPLOYEE_PROJECTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Проекты сотрудника',
  description: 'Проекты, где сотрудник списывал время (часы/доля/последняя дата)',
  component: EmployeeProjects,
});
