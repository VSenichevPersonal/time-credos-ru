import { defineFrontComponent } from 'twenty-sdk/define';

import { CredosSettings } from 'src/front-components/settings/settings';
import { CREDOS_TIME_SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Подраздел Settings → «Настройки Time Credos» (settingsCustomTab в application-config).
export default defineFrontComponent({
  universalIdentifier: CREDOS_TIME_SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Настройки Time Credos',
  description: 'Конфигурация модуля учёта трудозатрат (отделы, справочники)',
  component: CredosSettings,
});
