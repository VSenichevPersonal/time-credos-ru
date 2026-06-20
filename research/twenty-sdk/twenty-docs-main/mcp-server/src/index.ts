#!/usr/bin/env node
/**
 * Twenty CRM MCP Server
 *
 * Provides complete AI-native control over Twenty CRM via MCP protocol.
 * This allows any AI agent to:
 * - Create, read, update, delete any record
 * - Build and modify workflows
 * - Create views and dashboards
 * - Manage pipelines and stages
 * - Query and analyze data
 * - Send emails and manage calendar
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration from environment
const TWENTY_API_URL = process.env.TWENTY_API_URL || "https://crm.split-llc.com/rest";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

// Core CRM objects
const CRM_OBJECTS = [
  "companies",
  "people",
  "opportunities",
  "tasks",
  "notes",
  "dashboards",
  "workflows",
  "workflowVersions",
  "workflowRuns",
  "workflowAutomatedTriggers",
  "calendarEvents",
  "calendarChannels",
  "messages",
  "messageThreads",
  "messageChannels",
  "favorites",
  "favoriteFolders",
  "workspaceMembers",
  "attachments",
  "connectedAccounts",
  "timelineActivities",
  "blocklists",
  "noteTargets",
  "taskTargets"
] as const;

type CRMObject = typeof CRM_OBJECTS[number];

// API client
async function twentyAPI(
  method: string,
  path: string,
  body?: any
): Promise<any> {
  const url = `${TWENTY_API_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twenty API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Define all tools
const tools: Tool[] = [
  // === RECORD OPERATIONS ===
  {
    name: "twenty_list_records",
    description: "List records from any Twenty CRM object with filtering, sorting, and pagination. Objects: companies, people, opportunities, tasks, notes, dashboards, workflows, calendarEvents, messages, etc.",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          description: "Object type (e.g., companies, people, opportunities, tasks, notes)",
          enum: CRM_OBJECTS
        },
        filter: {
          type: "object",
          description: "Filter conditions (e.g., {name: {contains: 'Acme'}})"
        },
        orderBy: {
          type: "string",
          description: "Field to sort by (prefix with - for descending)"
        },
        limit: {
          type: "number",
          description: "Max records to return (default 20)"
        }
      },
      required: ["object"]
    }
  },
  {
    name: "twenty_get_record",
    description: "Get a single record by ID from any Twenty CRM object",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        id: {
          type: "string",
          description: "Record ID"
        }
      },
      required: ["object", "id"]
    }
  },
  {
    name: "twenty_create_record",
    description: "Create a new record in any Twenty CRM object",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        data: {
          type: "object",
          description: "Record data to create"
        }
      },
      required: ["object", "data"]
    }
  },
  {
    name: "twenty_update_record",
    description: "Update an existing record in Twenty CRM",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        id: {
          type: "string"
        },
        data: {
          type: "object",
          description: "Fields to update"
        }
      },
      required: ["object", "id", "data"]
    }
  },
  {
    name: "twenty_delete_record",
    description: "Delete a record from Twenty CRM",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        id: {
          type: "string"
        }
      },
      required: ["object", "id"]
    }
  },
  {
    name: "twenty_batch_create",
    description: "Create multiple records at once (up to 60)",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        records: {
          type: "array",
          items: { type: "object" },
          description: "Array of records to create"
        }
      },
      required: ["object", "records"]
    }
  },

  // === WORKFLOW OPERATIONS ===
  {
    name: "twenty_create_workflow",
    description: "Create a new automation workflow with triggers and actions",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Workflow name"
        },
        description: {
          type: "string"
        },
        trigger: {
          type: "object",
          description: "Trigger configuration: {type: 'record_created'|'record_updated'|'cron'|'manual', object?: string, pattern?: string}"
        },
        actions: {
          type: "array",
          description: "Array of actions: {type: 'create_record'|'update_record'|'send_email'|'http_request'|'code', config: {}}"
        }
      },
      required: ["name", "trigger", "actions"]
    }
  },
  {
    name: "twenty_run_workflow",
    description: "Manually trigger a workflow execution",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string"
        },
        input: {
          type: "object",
          description: "Input data for the workflow"
        }
      },
      required: ["workflowId"]
    }
  },

  // === PIPELINE OPERATIONS ===
  {
    name: "twenty_list_pipeline_stages",
    description: "List all opportunity stages in the pipeline",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "twenty_move_opportunity_stage",
    description: "Move an opportunity to a different pipeline stage",
    inputSchema: {
      type: "object",
      properties: {
        opportunityId: {
          type: "string"
        },
        stage: {
          type: "string",
          description: "New stage (e.g., QUALIFICATION, MEETING, PROPOSAL, NEGOTIATION, CLOSING, WON, LOST)"
        }
      },
      required: ["opportunityId", "stage"]
    }
  },

  // === DASHBOARD OPERATIONS ===
  {
    name: "twenty_create_dashboard",
    description: "Create a new dashboard with widgets",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        description: {
          type: "string"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "twenty_duplicate_dashboard",
    description: "Duplicate an existing dashboard",
    inputSchema: {
      type: "object",
      properties: {
        dashboardId: {
          type: "string"
        }
      },
      required: ["dashboardId"]
    }
  },

  // === SEARCH & ANALYTICS ===
  {
    name: "twenty_search",
    description: "Search across all CRM objects",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        objects: {
          type: "array",
          items: { type: "string" },
          description: "Objects to search (default: all)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "twenty_aggregate",
    description: "Aggregate data for analytics (count, sum, avg by field)",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        operation: {
          type: "string",
          enum: ["count", "sum", "avg", "min", "max"]
        },
        field: {
          type: "string",
          description: "Field to aggregate (not needed for count)"
        },
        groupBy: {
          type: "string",
          description: "Field to group by"
        },
        filter: {
          type: "object"
        }
      },
      required: ["object", "operation"]
    }
  },

  // === TASK MANAGEMENT ===
  {
    name: "twenty_create_task",
    description: "Create a task linked to a record",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        status: {
          type: "string",
          enum: ["TODO", "IN_PROGRESS", "DONE"]
        },
        dueAt: {
          type: "string",
          description: "Due date (ISO format or relative like 'tomorrow', 'next week')"
        },
        assigneeId: {
          type: "string"
        },
        linkedRecordId: {
          type: "string"
        },
        linkedRecordType: {
          type: "string",
          enum: ["company", "person", "opportunity"]
        }
      },
      required: ["title"]
    }
  },

  // === NOTES ===
  {
    name: "twenty_create_note",
    description: "Create a note attached to a record",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        body: {
          type: "string",
          description: "Note content (markdown supported)"
        },
        linkedRecordId: {
          type: "string"
        },
        linkedRecordType: {
          type: "string",
          enum: ["company", "person", "opportunity"]
        }
      },
      required: ["title", "body"]
    }
  },

  // === EMAIL OPERATIONS ===
  {
    name: "twenty_send_email",
    description: "Send an email through connected account",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "array",
          items: { type: "string" },
          description: "Recipient email addresses"
        },
        subject: {
          type: "string"
        },
        body: {
          type: "string",
          description: "Email body (HTML supported)"
        },
        linkedRecordId: {
          type: "string"
        }
      },
      required: ["to", "subject", "body"]
    }
  },

  // === CALENDAR ===
  {
    name: "twenty_list_calendar_events",
    description: "List upcoming calendar events",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Start date (ISO format)"
        },
        to: {
          type: "string",
          description: "End date (ISO format)"
        },
        limit: {
          type: "number"
        }
      }
    }
  },

  // === FAVORITES ===
  {
    name: "twenty_add_favorite",
    description: "Add a record to favorites",
    inputSchema: {
      type: "object",
      properties: {
        recordId: {
          type: "string"
        },
        recordType: {
          type: "string"
        },
        folderId: {
          type: "string",
          description: "Optional folder to add to"
        }
      },
      required: ["recordId", "recordType"]
    }
  },

  // === TIMELINE & ACTIVITY ===
  {
    name: "twenty_get_timeline",
    description: "Get activity timeline for a record (all interactions, changes, emails, notes, tasks)",
    inputSchema: {
      type: "object",
      properties: {
        recordId: {
          type: "string",
          description: "The record ID to get timeline for"
        },
        recordType: {
          type: "string",
          enum: ["company", "person", "opportunity"],
          description: "Type of record"
        },
        limit: {
          type: "number",
          description: "Max activities to return (default 50)"
        }
      },
      required: ["recordId", "recordType"]
    }
  },

  // === RESTORE OPERATIONS ===
  {
    name: "twenty_restore_record",
    description: "Restore a soft-deleted record",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: CRM_OBJECTS
        },
        id: {
          type: "string",
          description: "ID of the deleted record to restore"
        }
      },
      required: ["object", "id"]
    }
  },

  // === DUPLICATE MANAGEMENT ===
  {
    name: "twenty_find_duplicates",
    description: "Find potential duplicate records",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: ["companies", "people"]
        },
        recordId: {
          type: "string",
          description: "Optional: find duplicates of this specific record"
        }
      },
      required: ["object"]
    }
  },
  {
    name: "twenty_merge_records",
    description: "Merge duplicate records into one",
    inputSchema: {
      type: "object",
      properties: {
        object: {
          type: "string",
          enum: ["companies", "people"]
        },
        targetId: {
          type: "string",
          description: "ID of the record to keep"
        },
        sourceIds: {
          type: "array",
          items: { type: "string" },
          description: "IDs of records to merge into target"
        }
      },
      required: ["object", "targetId", "sourceIds"]
    }
  },

  // === WORKSPACE MEMBERS ===
  {
    name: "twenty_list_workspace_members",
    description: "List all workspace members (users)",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number"
        }
      }
    }
  },
  {
    name: "twenty_get_workspace_member",
    description: "Get details of a workspace member",
    inputSchema: {
      type: "object",
      properties: {
        memberId: {
          type: "string"
        }
      },
      required: ["memberId"]
    }
  },

  // === CONNECTED ACCOUNTS ===
  {
    name: "twenty_list_connected_accounts",
    description: "List all connected OAuth accounts (Gmail, Calendar, etc.)",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },

  // === MESSAGE THREADS ===
  {
    name: "twenty_list_message_threads",
    description: "List email/message threads for a contact or company",
    inputSchema: {
      type: "object",
      properties: {
        linkedRecordId: {
          type: "string",
          description: "Optional: filter by linked record"
        },
        linkedRecordType: {
          type: "string",
          enum: ["company", "person"]
        },
        limit: {
          type: "number"
        }
      }
    }
  },
  {
    name: "twenty_get_messages_in_thread",
    description: "Get all messages in a thread",
    inputSchema: {
      type: "object",
      properties: {
        threadId: {
          type: "string"
        }
      },
      required: ["threadId"]
    }
  },

  // === BLOCKLIST ===
  {
    name: "twenty_add_to_blocklist",
    description: "Add email/domain to blocklist (prevents sync)",
    inputSchema: {
      type: "object",
      properties: {
        handle: {
          type: "string",
          description: "Email or domain to block"
        },
        type: {
          type: "string",
          enum: ["EMAIL", "DOMAIN"]
        }
      },
      required: ["handle", "type"]
    }
  },
  {
    name: "twenty_list_blocklist",
    description: "List all blocked emails/domains",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },

  // === METADATA / CUSTOM OBJECTS ===
  {
    name: "twenty_list_objects",
    description: "List all available objects (standard and custom) with their fields",
    inputSchema: {
      type: "object",
      properties: {
        includeFields: {
          type: "boolean",
          description: "Include field definitions (default false)"
        }
      }
    }
  },
  {
    name: "twenty_get_object_schema",
    description: "Get full schema for an object including all fields and their types",
    inputSchema: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Name of the object (e.g., companies, people, or custom object)"
        }
      },
      required: ["objectName"]
    }
  },
  {
    name: "twenty_create_custom_object",
    description: "Create a new custom object type",
    inputSchema: {
      type: "object",
      properties: {
        singularName: {
          type: "string",
          description: "Singular name (e.g., 'invoice')"
        },
        pluralName: {
          type: "string",
          description: "Plural name (e.g., 'invoices')"
        },
        description: {
          type: "string"
        },
        icon: {
          type: "string",
          description: "Icon name (e.g., 'IconFileInvoice')"
        }
      },
      required: ["singularName", "pluralName"]
    }
  },
  {
    name: "twenty_add_field_to_object",
    description: "Add a custom field to an object",
    inputSchema: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "Object to add field to"
        },
        fieldName: {
          type: "string",
          description: "Field name (camelCase)"
        },
        fieldType: {
          type: "string",
          enum: ["TEXT", "NUMBER", "DATE", "BOOLEAN", "CURRENCY", "EMAIL", "LINK", "PHONE", "RATING", "RELATION", "SELECT", "MULTI_SELECT"],
          description: "Field type"
        },
        label: {
          type: "string",
          description: "Display label"
        },
        description: {
          type: "string"
        },
        isRequired: {
          type: "boolean"
        },
        isUnique: {
          type: "boolean"
        },
        options: {
          type: "array",
          description: "Options for SELECT/MULTI_SELECT fields"
        }
      },
      required: ["objectName", "fieldName", "fieldType", "label"]
    }
  },

  // === WEBHOOKS ===
  {
    name: "twenty_create_webhook",
    description: "Create a webhook to receive real-time notifications",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Webhook endpoint URL"
        },
        description: {
          type: "string"
        }
      },
      required: ["url"]
    }
  },
  {
    name: "twenty_list_webhooks",
    description: "List all configured webhooks",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "twenty_delete_webhook",
    description: "Delete a webhook",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: {
          type: "string"
        }
      },
      required: ["webhookId"]
    }
  },

  // === WORKFLOW AUTOMATION ===
  {
    name: "twenty_list_workflow_triggers",
    description: "List all automated workflow triggers",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          description: "Optional: filter by workflow"
        }
      }
    }
  },
  {
    name: "twenty_activate_workflow",
    description: "Activate a workflow (change status from DRAFT to ACTIVE)",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string"
        }
      },
      required: ["workflowId"]
    }
  },
  {
    name: "twenty_deactivate_workflow",
    description: "Deactivate a workflow",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string"
        }
      },
      required: ["workflowId"]
    }
  },
  {
    name: "twenty_get_workflow_runs",
    description: "Get execution history for a workflow",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string"
        },
        status: {
          type: "string",
          enum: ["COMPLETED", "FAILED", "RUNNING"],
          description: "Filter by status"
        },
        limit: {
          type: "number"
        }
      },
      required: ["workflowId"]
    }
  }
];

// Tool handlers
async function handleTool(name: string, args: any): Promise<any> {
  switch (name) {
    // Record operations
    case "twenty_list_records": {
      const { object, filter, orderBy, limit = 20 } = args;
      const params = new URLSearchParams();
      if (filter) params.set("filter", JSON.stringify(filter));
      if (orderBy) params.set("order_by", orderBy);
      params.set("limit", String(limit));
      return twentyAPI("GET", `/${object}?${params}`);
    }

    case "twenty_get_record": {
      const { object, id } = args;
      return twentyAPI("GET", `/${object}/${id}`);
    }

    case "twenty_create_record": {
      const { object, data } = args;
      return twentyAPI("POST", `/${object}`, data);
    }

    case "twenty_update_record": {
      const { object, id, data } = args;
      return twentyAPI("PATCH", `/${object}/${id}`, data);
    }

    case "twenty_delete_record": {
      const { object, id } = args;
      return twentyAPI("DELETE", `/${object}/${id}`);
    }

    case "twenty_batch_create": {
      const { object, records } = args;
      return twentyAPI("POST", `/batch/${object}`, records);
    }

    // Workflow operations
    case "twenty_create_workflow": {
      const { name, description, trigger, actions } = args;
      const workflow = await twentyAPI("POST", "/workflows", {
        name,
        description,
        status: "DRAFT"
      });

      // Create workflow version with steps
      await twentyAPI("POST", "/workflowVersions", {
        workflowId: workflow.id,
        trigger,
        steps: actions
      });

      return workflow;
    }

    case "twenty_run_workflow": {
      const { workflowId, input } = args;
      return twentyAPI("POST", "/workflowRuns", {
        workflowId,
        input
      });
    }

    // Pipeline operations
    case "twenty_list_pipeline_stages": {
      // Return the standard Twenty opportunity stages
      return {
        stages: [
          { name: "QUALIFICATION", label: "Qualification", order: 1 },
          { name: "MEETING", label: "Meeting", order: 2 },
          { name: "PROPOSAL", label: "Proposal", order: 3 },
          { name: "NEGOTIATION", label: "Negotiation", order: 4 },
          { name: "CLOSING", label: "Closing", order: 5 },
          { name: "WON", label: "Won", order: 6 },
          { name: "LOST", label: "Lost", order: 7 }
        ]
      };
    }

    case "twenty_move_opportunity_stage": {
      const { opportunityId, stage } = args;
      return twentyAPI("PATCH", `/opportunities/${opportunityId}`, { stage });
    }

    // Dashboard operations
    case "twenty_create_dashboard": {
      const { name, description } = args;
      return twentyAPI("POST", "/dashboards", { name, description });
    }

    case "twenty_duplicate_dashboard": {
      const { dashboardId } = args;
      return twentyAPI("POST", `/dashboards/${dashboardId}/duplicate`);
    }

    // Search
    case "twenty_search": {
      const { query, objects } = args;
      const searchObjects = objects || ["companies", "people", "opportunities"];
      const results: any = {};

      for (const obj of searchObjects) {
        try {
          const data = await twentyAPI("GET", `/${obj}?filter=${JSON.stringify({
            or: [
              { name: { contains: query } },
              { email: { contains: query } }
            ]
          })}&limit=10`);
          results[obj] = data;
        } catch (e) {
          results[obj] = { error: (e as Error).message };
        }
      }

      return results;
    }

    // Aggregate
    case "twenty_aggregate": {
      const { object, operation, field, groupBy, filter } = args;
      const records = await twentyAPI("GET", `/${object}?${filter ? `filter=${JSON.stringify(filter)}&` : ""}limit=1000`);

      if (operation === "count") {
        if (groupBy) {
          const groups: Record<string, number> = {};
          for (const rec of records.data || records) {
            const key = rec[groupBy] || "null";
            groups[key] = (groups[key] || 0) + 1;
          }
          return { grouped: groups, total: (records.data || records).length };
        }
        return { count: (records.data || records).length };
      }

      // Sum, avg, min, max operations
      const values = (records.data || records)
        .map((r: any) => {
          const val = r[field];
          if (typeof val === "object" && val?.amountMicros) {
            return val.amountMicros / 1000000;
          }
          return typeof val === "number" ? val : 0;
        })
        .filter((v: number) => !isNaN(v));

      if (values.length === 0) return { result: 0 };

      switch (operation) {
        case "sum":
          return { sum: values.reduce((a: number, b: number) => a + b, 0) };
        case "avg":
          return { avg: values.reduce((a: number, b: number) => a + b, 0) / values.length };
        case "min":
          return { min: Math.min(...values) };
        case "max":
          return { max: Math.max(...values) };
        default:
          return { error: "Unknown operation" };
      }
    }

    // Task management
    case "twenty_create_task": {
      const { title, status = "TODO", dueAt, assigneeId, linkedRecordId, linkedRecordType } = args;

      let dueDate = dueAt;
      if (dueAt) {
        if (dueAt.toLowerCase() === "tomorrow") {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          dueDate = d.toISOString();
        } else if (dueAt.toLowerCase() === "next week") {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          dueDate = d.toISOString();
        }
      }

      const task = await twentyAPI("POST", "/tasks", {
        title,
        status,
        dueAt: dueDate,
        assigneeId
      });

      // Link to record if specified
      if (linkedRecordId && linkedRecordType) {
        await twentyAPI("POST", "/taskTargets", {
          taskId: task.id,
          [`${linkedRecordType}Id`]: linkedRecordId
        });
      }

      return task;
    }

    // Notes
    case "twenty_create_note": {
      const { title, body, linkedRecordId, linkedRecordType } = args;

      const note = await twentyAPI("POST", "/notes", { title, body });

      if (linkedRecordId && linkedRecordType) {
        await twentyAPI("POST", "/noteTargets", {
          noteId: note.id,
          [`${linkedRecordType}Id`]: linkedRecordId
        });
      }

      return note;
    }

    // Calendar
    case "twenty_list_calendar_events": {
      const { from, to, limit = 20 } = args;
      const params = new URLSearchParams();

      if (from || to) {
        const filter: any = {};
        if (from) filter.startsAt = { gte: from };
        if (to) filter.endsAt = { lte: to };
        params.set("filter", JSON.stringify(filter));
      }

      params.set("limit", String(limit));
      params.set("order_by", "startsAt");

      return twentyAPI("GET", `/calendarEvents?${params}`);
    }

    // Favorites
    case "twenty_add_favorite": {
      const { recordId, recordType, folderId } = args;
      return twentyAPI("POST", "/favorites", {
        [`${recordType}Id`]: recordId,
        favoriteFolderId: folderId
      });
    }

    // Email (placeholder - needs connected account)
    case "twenty_send_email": {
      return { error: "Email sending requires workflow action or connected account setup" };
    }

    // Timeline
    case "twenty_get_timeline": {
      const { recordId, recordType, limit = 50 } = args;
      const filter = { [`${recordType}Id`]: { eq: recordId } };
      return twentyAPI("GET", `/timelineActivities?filter=${JSON.stringify(filter)}&limit=${limit}&order_by=-createdAt`);
    }

    // Restore
    case "twenty_restore_record": {
      const { object, id } = args;
      return twentyAPI("POST", `/restore/${object}`, { id });
    }

    // Duplicates
    case "twenty_find_duplicates": {
      const { object, recordId } = args;
      if (recordId) {
        return twentyAPI("POST", `/${object}/duplicates`, { id: recordId });
      }
      return twentyAPI("GET", `/${object}/duplicates`);
    }

    case "twenty_merge_records": {
      const { object, targetId, sourceIds } = args;
      return twentyAPI("POST", `/${object}/merge`, {
        targetId,
        sourceIds
      });
    }

    // Workspace members
    case "twenty_list_workspace_members": {
      const { limit = 50 } = args;
      return twentyAPI("GET", `/workspaceMembers?limit=${limit}`);
    }

    case "twenty_get_workspace_member": {
      const { memberId } = args;
      return twentyAPI("GET", `/workspaceMembers/${memberId}`);
    }

    // Connected accounts
    case "twenty_list_connected_accounts": {
      return twentyAPI("GET", "/connectedAccounts");
    }

    // Message threads
    case "twenty_list_message_threads": {
      const { linkedRecordId, linkedRecordType, limit = 20 } = args;
      let path = `/messageThreads?limit=${limit}&order_by=-lastMessageReceivedAt`;
      if (linkedRecordId && linkedRecordType) {
        const filter = { [`${linkedRecordType}Id`]: { eq: linkedRecordId } };
        path += `&filter=${JSON.stringify(filter)}`;
      }
      return twentyAPI("GET", path);
    }

    case "twenty_get_messages_in_thread": {
      const { threadId } = args;
      const filter = { messageThreadId: { eq: threadId } };
      return twentyAPI("GET", `/messages?filter=${JSON.stringify(filter)}&order_by=receivedAt`);
    }

    // Blocklist
    case "twenty_add_to_blocklist": {
      const { handle, type } = args;
      return twentyAPI("POST", "/blocklists", { handle, type });
    }

    case "twenty_list_blocklist": {
      return twentyAPI("GET", "/blocklists");
    }

    // Metadata / Custom Objects
    case "twenty_list_objects": {
      const { includeFields } = args;
      // Use metadata GraphQL endpoint
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");
      const query = includeFields
        ? `{ objects { edges { node { id nameSingular namePlural isCustom fields { edges { node { id name type label } } } } } } }`
        : `{ objects { edges { node { id nameSingular namePlural isCustom } } } }`;

      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Metadata API error: ${await response.text()}`);
      }

      return response.json();
    }

    case "twenty_get_object_schema": {
      const { objectName } = args;
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");
      const query = `{
        objects(filter: { namePlural: { eq: "${objectName}" } }) {
          edges {
            node {
              id
              nameSingular
              namePlural
              labelSingular
              labelPlural
              isCustom
              fields {
                edges {
                  node {
                    id
                    name
                    type
                    label
                    description
                    isCustom
                    isNullable
                    isUnique
                    defaultValue
                    options
                  }
                }
              }
            }
          }
        }
      }`;

      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Metadata API error: ${await response.text()}`);
      }

      return response.json();
    }

    case "twenty_create_custom_object": {
      const { singularName, pluralName, description, icon } = args;
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");
      const mutation = `
        mutation CreateCustomObject($input: CreateObjectInput!) {
          createObject(input: $input) {
            id
            nameSingular
            namePlural
          }
        }
      `;

      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              nameSingular: singularName,
              namePlural: pluralName,
              labelSingular: singularName.charAt(0).toUpperCase() + singularName.slice(1),
              labelPlural: pluralName.charAt(0).toUpperCase() + pluralName.slice(1),
              description,
              icon: icon || "IconBox",
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Metadata API error: ${await response.text()}`);
      }

      return response.json();
    }

    case "twenty_add_field_to_object": {
      const { objectName, fieldName, fieldType, label, description, isRequired, isUnique, options } = args;
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");

      // First get the object ID
      const objectQuery = `{ objects(filter: { namePlural: { eq: "${objectName}" } }) { edges { node { id } } } }`;
      const objectResponse = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({ query: objectQuery }),
      });

      const objectData = await objectResponse.json();
      const objectId = objectData?.data?.objects?.edges?.[0]?.node?.id;

      if (!objectId) {
        throw new Error(`Object "${objectName}" not found`);
      }

      const mutation = `
        mutation CreateField($input: CreateFieldInput!) {
          createField(input: $input) {
            id
            name
            type
            label
          }
        }
      `;

      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              objectMetadataId: objectId,
              name: fieldName,
              type: fieldType,
              label,
              description,
              isNullable: !isRequired,
              isUnique: isUnique || false,
              options,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Metadata API error: ${await response.text()}`);
      }

      return response.json();
    }

    // Webhooks (via GraphQL - webhooks are managed via settings)
    case "twenty_create_webhook": {
      const { url, description } = args;
      // Webhooks are managed via GraphQL
      const graphqlUrl = TWENTY_API_URL.replace("/rest", "/graphql");
      const mutation = `
        mutation CreateWebhook($input: WebhookCreateInput!) {
          createWebhook(data: $input) {
            id
            targetUrl
            description
          }
        }
      `;

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              targetUrl: url,
              description,
            },
          },
        }),
      });

      return response.json();
    }

    case "twenty_list_webhooks": {
      const graphqlUrl = TWENTY_API_URL.replace("/rest", "/graphql");
      const query = `{ webhooks { edges { node { id targetUrl description createdAt } } } }`;

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({ query }),
      });

      return response.json();
    }

    case "twenty_delete_webhook": {
      const { webhookId } = args;
      const graphqlUrl = TWENTY_API_URL.replace("/rest", "/graphql");
      const mutation = `
        mutation DeleteWebhook($id: ID!) {
          deleteWebhook(id: $id) {
            id
          }
        }
      `;

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { id: webhookId },
        }),
      });

      return response.json();
    }

    // Workflow automation
    case "twenty_list_workflow_triggers": {
      const { workflowId } = args;
      let path = "/workflowAutomatedTriggers";
      if (workflowId) {
        path += `?filter=${JSON.stringify({ workflowId: { eq: workflowId } })}`;
      }
      return twentyAPI("GET", path);
    }

    case "twenty_activate_workflow": {
      const { workflowId } = args;
      return twentyAPI("PATCH", `/workflows/${workflowId}`, { status: "ACTIVE" });
    }

    case "twenty_deactivate_workflow": {
      const { workflowId } = args;
      return twentyAPI("PATCH", `/workflows/${workflowId}`, { status: "DEACTIVATED" });
    }

    case "twenty_get_workflow_runs": {
      const { workflowId, status, limit = 20 } = args;
      const filter: any = { workflowId: { eq: workflowId } };
      if (status) filter.status = { eq: status };
      return twentyAPI("GET", `/workflowRuns?filter=${JSON.stringify(filter)}&limit=${limit}&order_by=-createdAt`);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create and start server
const server = new Server(
  {
    name: "twenty-crm-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleTool(name, args || {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Twenty CRM MCP Server running");
}

main().catch(console.error);
