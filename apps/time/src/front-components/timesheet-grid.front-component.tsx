import { defineFrontComponent } from 'twenty-sdk/define';

import { TimesheetGridScreen } from 'src/front-components/reports/timesheet-grid/timesheet-grid';

// Экран «Табель Т-13» (REQ-0006 п.4): сетка сотрудник×день за месяц, данные
// /s/reports groupBy=timesheet-grid. UUID объявлены ЛОКАЛЬНО (constants.ts —
// hot-file параллельных потоков); page-layout/nav импортируют отсюда.
export const TIMESHEET_T13_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '7e1a2b3c-4d5e-4f60-9a71-2b3c4d5e6f70';
export const TIMESHEET_T13_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  '8f2b3c4d-5e6f-4071-8b82-3c4d5e6f7081';
export const TIMESHEET_T13_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  '9a3c4d5e-6f70-4182-9c93-4d5e6f708192';
export const TIMESHEET_T13_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  'ab4d5e6f-7081-4293-8da4-5e6f708192a3';
export const TIMESHEET_T13_NAV_UNIVERSAL_IDENTIFIER =
  'bc5e6f70-8192-43a4-9eb5-6f708192a3b4';

export default defineFrontComponent({
  universalIdentifier: TIMESHEET_T13_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Табель Т-13',
  description: 'Табель учёта рабочего времени (сотрудник×день, форма Т-13)',
  component: TimesheetGridScreen,
});
