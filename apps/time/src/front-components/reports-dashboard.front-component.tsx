import { defineFrontComponent } from 'twenty-sdk/define';

import { ReportsDashboard } from 'src/front-components/reports/reports-dashboard';
import { REPORTS_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Виджет «Отчёты»: дашборд утилизации + загрузки/недогруза (данные /s/reports).
export default defineFrontComponent({
  universalIdentifier: REPORTS_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Отчёты',
  description: 'Дашборд утилизации и загрузки (срезы отдел/проект/человек)',
  component: ReportsDashboard,
});
