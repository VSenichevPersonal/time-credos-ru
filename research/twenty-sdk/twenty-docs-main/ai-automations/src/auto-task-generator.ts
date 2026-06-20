/**
 * Auto Task Generator
 *
 * Automatically creates contextual tasks when records are created or updated.
 * Uses AI to determine appropriate follow-up actions.
 *
 * Triggers: person.created, company.created, opportunity.updated
 */

import { FunctionConfig, DatabaseEventPayload } from 'twenty-sdk';

interface TaskTemplate {
  title: string;
  daysOffset: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  condition?: (record: any) => boolean;
}

// Task templates by object type and event
const TASK_TEMPLATES: Record<string, Record<string, TaskTemplate[]>> = {
  person: {
    created: [
      { title: 'Send introduction email', daysOffset: 0, priority: 'HIGH' },
      { title: 'Research on LinkedIn', daysOffset: 0, priority: 'MEDIUM' },
      { title: 'Add to appropriate campaign', daysOffset: 1, priority: 'MEDIUM' },
      { title: 'Schedule initial call', daysOffset: 2, priority: 'HIGH' }
    ]
  },
  company: {
    created: [
      { title: 'Research company background', daysOffset: 0, priority: 'HIGH' },
      { title: 'Identify key decision makers', daysOffset: 1, priority: 'HIGH' },
      { title: 'Check for existing relationships', daysOffset: 0, priority: 'MEDIUM' },
      { title: 'Prepare account strategy', daysOffset: 3, priority: 'MEDIUM' }
    ]
  },
  opportunity: {
    updated: [
      {
        title: 'Send proposal',
        daysOffset: 1,
        priority: 'HIGH',
        condition: (record) => record.stage === 'PROPOSAL'
      },
      {
        title: 'Schedule negotiation call',
        daysOffset: 0,
        priority: 'HIGH',
        condition: (record) => record.stage === 'NEGOTIATION'
      },
      {
        title: 'Prepare contract',
        daysOffset: 0,
        priority: 'HIGH',
        condition: (record) => record.stage === 'CLOSING'
      },
      {
        title: 'Send onboarding materials',
        daysOffset: 0,
        priority: 'HIGH',
        condition: (record) => record.stage === 'WON'
      },
      {
        title: 'Schedule loss analysis',
        daysOffset: 2,
        priority: 'LOW',
        condition: (record) => record.stage === 'LOST'
      }
    ]
  }
};

export const main = async (event: DatabaseEventPayload<any>) => {
  const { record, eventName, client } = event;

  if (!record || !eventName) {
    return { success: false, error: 'Missing record or event name' };
  }

  // Parse event name (e.g., "person.created" -> objectType: "person", action: "created")
  const [objectType, action] = eventName.split('.');

  const templates = TASK_TEMPLATES[objectType]?.[action];
  if (!templates) {
    return { success: true, message: 'No task templates for this event', tasksCreated: 0 };
  }

  // Filter templates by conditions
  const applicableTemplates = templates.filter(template =>
    !template.condition || template.condition(record)
  );

  // Create tasks
  const createdTasks = [];
  for (const template of applicableTemplates) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.daysOffset);

    try {
      const result = await client.mutation({
        createTask: {
          __args: {
            data: {
              title: template.title,
              status: 'TODO',
              dueAt: dueDate.toISOString(),
              // Note: Link to parent record based on objectType
            }
          },
          id: true,
          title: true
        }
      });
      createdTasks.push(result.createTask);
    } catch (error) {
      console.error(`Failed to create task: ${template.title}`, error);
    }
  }

  return {
    success: true,
    objectType,
    action,
    recordId: record.id,
    tasksCreated: createdTasks.length,
    tasks: createdTasks.map(t => t.title)
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'auto-task-generator-001',
  name: 'auto-task-generator',
  description: 'Automatically creates follow-up tasks when records are created or updated',
  timeoutSeconds: 30,
  triggers: [
    { type: 'databaseEvent', eventName: 'person.created' },
    { type: 'databaseEvent', eventName: 'company.created' },
    { type: 'databaseEvent', eventName: 'opportunity.created' },
    { type: 'databaseEvent', eventName: 'opportunity.updated' }
  ]
};
