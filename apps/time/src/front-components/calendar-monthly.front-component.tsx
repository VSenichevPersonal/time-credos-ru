import { defineFrontComponent } from 'twenty-sdk/define';

import { CalendarMonthly } from 'src/front-components/calendar/calendar-monthly';
import { CALENDAR_MONTHLY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Раздел «Производственный календарь»: помесячный агрегат (5/2) — рабочие
// дни/часы по месяцам и кварталам.
export default defineFrontComponent({
  universalIdentifier: CALENDAR_MONTHLY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Производственный календарь',
  description: 'Помесячный агрегат производственного календаря РФ (график 5/2)',
  component: CalendarMonthly,
});
