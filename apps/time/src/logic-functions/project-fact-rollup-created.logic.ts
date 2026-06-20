import { defineLogicFunction } from 'twenty-sdk/define';

import { PROJECT_FACT_ROLLUP_CREATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { onEntryCreated, wrapEvent } from './project-fact-rollup-events';

// database-event триггер: пересчёт factHours/budgetRemaining проекта при СОЗДАНИИ
// записи трудозатрат любым путём (грид Twenty, CSV-импорт, REST). См. полный
// контекст в project-fact-rollup-events.ts / project-fact-rollup.ts.
export default defineLogicFunction({
  universalIdentifier: PROJECT_FACT_ROLLUP_CREATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'project-fact-rollup-created',
  description: 'Пересчёт factHours/budgetRemaining проекта при создании записи трудозатрат',
  timeoutSeconds: 15,
  handler: wrapEvent(onEntryCreated),
  databaseEventTriggerSettings: { eventName: 'credosTimeEntry.created' },
});
