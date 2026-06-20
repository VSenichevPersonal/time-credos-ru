#!/usr/bin/env node
/**
 * Twenty CRM MCP Server - HTTP/SSE Transport
 *
 * Production-ready HTTP server with Server-Sent Events for remote AI agent access.
 * Supports both SSE streaming and Streamable HTTP transport.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer, IncomingMessage, ServerResponse } from "http";

// Configuration from environment
const TWENTY_API_URL = process.env.TWENTY_API_URL || "https://crm.split-llc.com/rest";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Core CRM objects
const CRM_OBJECTS = [
  "companies", "people", "opportunities", "tasks", "notes",
  "dashboards", "workflows", "workflowVersions", "workflowRuns",
  "workflowAutomatedTriggers", "calendarEvents", "calendarChannels",
  "messages", "messageThreads", "messageChannels", "favorites",
  "favoriteFolders", "workspaceMembers", "attachments",
  "connectedAccounts", "timelineActivities", "blocklists",
  "noteTargets", "taskTargets"
] as const;

type CRMObject = typeof CRM_OBJECTS[number];

// API client
async function twentyAPI(method: string, path: string, body?: any): Promise<any> {
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

// Tool definitions (same as stdio version)
const tools: Tool[] = [
  {
    name: "twenty_list_records",
    description: "List records from any Twenty CRM object with filtering, sorting, and pagination",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        filter: { type: "object", description: "Filter conditions" },
        orderBy: { type: "string", description: "Sort field (prefix with - for desc)" },
        limit: { type: "number", description: "Max records (default 20)" }
      },
      required: ["object"]
    }
  },
  {
    name: "twenty_get_record",
    description: "Get a single record by ID",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        id: { type: "string" }
      },
      required: ["object", "id"]
    }
  },
  {
    name: "twenty_create_record",
    description: "Create a new record",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        data: { type: "object" }
      },
      required: ["object", "data"]
    }
  },
  {
    name: "twenty_update_record",
    description: "Update an existing record",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        id: { type: "string" },
        data: { type: "object" }
      },
      required: ["object", "id", "data"]
    }
  },
  {
    name: "twenty_delete_record",
    description: "Delete a record",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        id: { type: "string" }
      },
      required: ["object", "id"]
    }
  },
  {
    name: "twenty_search",
    description: "Search across CRM objects",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        objects: { type: "array", items: { type: "string" } }
      },
      required: ["query"]
    }
  },
  {
    name: "twenty_aggregate",
    description: "Aggregate data (count, sum, avg, min, max)",
    inputSchema: {
      type: "object",
      properties: {
        object: { type: "string", enum: CRM_OBJECTS },
        operation: { type: "string", enum: ["count", "sum", "avg", "min", "max"] },
        field: { type: "string" },
        groupBy: { type: "string" },
        filter: { type: "object" }
      },
      required: ["object", "operation"]
    }
  },
  {
    name: "twenty_create_task",
    description: "Create a task with optional linking",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
        dueAt: { type: "string" },
        assigneeId: { type: "string" },
        linkedRecordId: { type: "string" },
        linkedRecordType: { type: "string", enum: ["company", "person", "opportunity"] }
      },
      required: ["title"]
    }
  },
  {
    name: "twenty_create_note",
    description: "Create a note attached to a record",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        linkedRecordId: { type: "string" },
        linkedRecordType: { type: "string", enum: ["company", "person", "opportunity"] }
      },
      required: ["title", "body"]
    }
  },
  {
    name: "twenty_list_pipeline_stages",
    description: "List opportunity pipeline stages",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "twenty_move_opportunity_stage",
    description: "Move opportunity to different stage",
    inputSchema: {
      type: "object",
      properties: {
        opportunityId: { type: "string" },
        stage: { type: "string" }
      },
      required: ["opportunityId", "stage"]
    }
  },
  {
    name: "twenty_create_workflow",
    description: "Create an automation workflow",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        trigger: { type: "object" },
        actions: { type: "array" }
      },
      required: ["name", "trigger", "actions"]
    }
  },
  {
    name: "twenty_list_objects",
    description: "List all CRM objects (standard + custom)",
    inputSchema: {
      type: "object",
      properties: {
        includeFields: { type: "boolean" }
      }
    }
  },
  {
    name: "twenty_get_object_schema",
    description: "Get full schema for an object",
    inputSchema: {
      type: "object",
      properties: {
        objectName: { type: "string" }
      },
      required: ["objectName"]
    }
  }
];

// Tool handler (simplified - full implementation in index.ts)
async function handleTool(name: string, args: any): Promise<any> {
  switch (name) {
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
    case "twenty_search": {
      const { query, objects = ["companies", "people", "opportunities"] } = args;
      const results: any = {};
      for (const obj of objects) {
        try {
          const data = await twentyAPI("GET", `/${obj}?filter=${JSON.stringify({
            or: [{ name: { contains: query } }, { email: { contains: query } }]
          })}&limit=10`);
          results[obj] = data;
        } catch (e) {
          results[obj] = { error: (e as Error).message };
        }
      }
      return results;
    }
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
      const values = (records.data || records).map((r: any) => {
        const val = r[field];
        if (typeof val === "object" && val?.amountMicros) return val.amountMicros / 1000000;
        return typeof val === "number" ? val : 0;
      }).filter((v: number) => !isNaN(v));
      if (values.length === 0) return { result: 0 };
      switch (operation) {
        case "sum": return { sum: values.reduce((a: number, b: number) => a + b, 0) };
        case "avg": return { avg: values.reduce((a: number, b: number) => a + b, 0) / values.length };
        case "min": return { min: Math.min(...values) };
        case "max": return { max: Math.max(...values) };
        default: return { error: "Unknown operation" };
      }
    }
    case "twenty_create_task": {
      const { title, status = "TODO", dueAt, assigneeId, linkedRecordId, linkedRecordType } = args;
      let dueDate = dueAt;
      if (dueAt?.toLowerCase() === "tomorrow") {
        const d = new Date(); d.setDate(d.getDate() + 1); dueDate = d.toISOString();
      } else if (dueAt?.toLowerCase() === "next week") {
        const d = new Date(); d.setDate(d.getDate() + 7); dueDate = d.toISOString();
      }
      const task = await twentyAPI("POST", "/tasks", { title, status, dueAt: dueDate, assigneeId });
      if (linkedRecordId && linkedRecordType) {
        await twentyAPI("POST", "/taskTargets", { taskId: task.id, [`${linkedRecordType}Id`]: linkedRecordId });
      }
      return task;
    }
    case "twenty_create_note": {
      const { title, body, linkedRecordId, linkedRecordType } = args;
      const note = await twentyAPI("POST", "/notes", { title, body });
      if (linkedRecordId && linkedRecordType) {
        await twentyAPI("POST", "/noteTargets", { noteId: note.id, [`${linkedRecordType}Id`]: linkedRecordId });
      }
      return note;
    }
    case "twenty_list_pipeline_stages":
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
    case "twenty_move_opportunity_stage": {
      const { opportunityId, stage } = args;
      return twentyAPI("PATCH", `/opportunities/${opportunityId}`, { stage });
    }
    case "twenty_create_workflow": {
      const { name, description, trigger, actions } = args;
      const workflow = await twentyAPI("POST", "/workflows", { name, description, status: "DRAFT" });
      await twentyAPI("POST", "/workflowVersions", { workflowId: workflow.id, trigger, steps: actions });
      return workflow;
    }
    case "twenty_list_objects": {
      const { includeFields } = args;
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");
      const query = includeFields
        ? `{ objects { edges { node { id nameSingular namePlural isCustom fields { edges { node { id name type label } } } } } } }`
        : `{ objects { edges { node { id nameSingular namePlural isCustom } } } }`;
      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TWENTY_API_KEY}` },
        body: JSON.stringify({ query }),
      });
      return response.json();
    }
    case "twenty_get_object_schema": {
      const { objectName } = args;
      const metadataUrl = TWENTY_API_URL.replace("/rest", "/metadata");
      const query = `{ objects(filter: { namePlural: { eq: "${objectName}" } }) { edges { node { id nameSingular namePlural labelSingular labelPlural isCustom fields { edges { node { id name type label description isCustom isNullable isUnique defaultValue options } } } } } } }`;
      const response = await fetch(metadataUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TWENTY_API_KEY}` },
        body: JSON.stringify({ query }),
      });
      return response.json();
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create MCP server
const mcpServer = new Server(
  { name: "twenty-crm-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
  }
});

// HTTP Server with SSE transport
const transports = new Map<string, SSEServerTransport>();

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === "/health" || url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "healthy",
      server: "twenty-crm-mcp-server",
      version: "1.0.0",
      tools: tools.length,
      api: TWENTY_API_URL
    }));
    return;
  }

  // SSE endpoint for MCP connections
  if (url.pathname === "/sse") {
    console.log("New SSE connection");
    const transport = new SSEServerTransport("/message", res);
    const sessionId = crypto.randomUUID();
    transports.set(sessionId, transport);

    res.on("close", () => {
      console.log(`SSE connection closed: ${sessionId}`);
      transports.delete(sessionId);
    });

    await mcpServer.connect(transport);
    return;
  }

  // Message endpoint for SSE transport
  if (url.pathname === "/message" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        // Find the transport and handle message
        for (const transport of transports.values()) {
          // The transport will handle routing
          await transport.handlePostMessage(req, res, body);
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No active session" }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
    });
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Twenty CRM MCP Server (HTTP/SSE) running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
  console.log(`Connected to Twenty API: ${TWENTY_API_URL}`);
});
