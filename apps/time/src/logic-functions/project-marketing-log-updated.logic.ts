import { defineLogicFunction } from 'twenty-sdk/define';

import { PROJECT_MARKETING_LOG_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import {
  MARKETING_FIELDS,
  onProjectMarketingUpdated,
  wrapMarketingEvent,
} from './project-marketing-log-events';

// MARKETING-LOG: database-event триггер per-field журнала изменений МАРКЕТИНГ-полей
// проекта. Фильтр updatedFields на уровне ядра → функция дёргается ТОЛЬКО при
// изменении маркетинг-поля (ndaLevel/canPublishOnSite/isPublished/...). Для каждого
// изменённого поля пишется строка marketing-log {fieldName, oldValue→newValue, actor,
// changedAt}. Сбой лога не валит UPDATE проекта (try/catch в хендлере + wrap).
export default defineLogicFunction({
  universalIdentifier:
    PROJECT_MARKETING_LOG_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'project-marketing-log-updated',
  description:
    'Per-field журнал изменений маркетинг-полей проекта (кто/когда/старое→новое)',
  timeoutSeconds: 15,
  handler: wrapMarketingEvent(onProjectMarketingUpdated),
  databaseEventTriggerSettings: {
    eventName: 'credosTimeProject.updated',
    updatedFields: [...MARKETING_FIELDS],
  },
});
