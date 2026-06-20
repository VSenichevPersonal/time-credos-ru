import { defineLogicFunction } from 'twenty-sdk/define';

import { PROJECT_FACT_ROLLUP_DELETED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { onEntryDeleted, wrapEvent } from './project-fact-rollup-events';

// database-event триггер: пересчёт factHours/budgetRemaining проекта при УДАЛЕНИИ
// записи трудозатрат любым путём (часы выбыли из суммы).
export default defineLogicFunction({
  universalIdentifier: PROJECT_FACT_ROLLUP_DELETED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'project-fact-rollup-deleted',
  description: 'Пересчёт factHours/budgetRemaining проекта при удалении записи трудозатрат',
  timeoutSeconds: 15,
  handler: wrapEvent(onEntryDeleted),
  databaseEventTriggerSettings: { eventName: 'credosTimeEntry.deleted' },
});
