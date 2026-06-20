import { defineLogicFunction } from 'twenty-sdk/define';

import { PROJECT_FACT_ROLLUP_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { onEntryUpdated, wrapEvent } from './project-fact-rollup-events';

// database-event триггер: пересчёт factHours/budgetRemaining при ИЗМЕНЕНИИ записи
// трудозатрат (включая смену проекта — пересчитываются оба проекта). Фильтр
// updatedFields: только hours/projectId влияют на Σ часов (статус/комментарий
// согласования — нет), экономим лишние пересчёты.
export default defineLogicFunction({
  universalIdentifier: PROJECT_FACT_ROLLUP_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'project-fact-rollup-updated',
  description:
    'Пересчёт factHours/budgetRemaining проекта при изменении записи трудозатрат (включая смену проекта)',
  timeoutSeconds: 15,
  handler: wrapEvent(onEntryUpdated),
  databaseEventTriggerSettings: {
    eventName: 'credosTimeEntry.updated',
    updatedFields: ['hours', 'projectId'],
  },
});
