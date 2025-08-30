# 3) Dynamic Tool Calls

**Objective:** Discover and execute tools dynamically from all workspace integrations, replacing static `availableTools.ts`.

**Deliverables:**
- Tool to list all integrations and their URLs
- Tool to fetch directly from each MCP integration and get tool list with schemas
- Tool dispatcher that executes tools by `integrationId` + `toolName` + `input`
- Replacement of current `availableTools.ts` system with dynamic discovery

---

## Technical Steps:

### 1. Tool to Discover Integrations:
```typescript
// server/tools/dynamicTools.ts
const createDiscoverIntegrationsTool = (env: Env) => createTool({
  id: "DISCOVER_INTEGRATIONS",
  description: "List all workspace MCP integrations",
  inputSchema: z.object({}),
  outputSchema: z.object({
    integrations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      connection: z.object({
        type: z.string(),
        url: z.string(),
        token: z.string().optional()
      })
    }))
  }),
  execute: async () => {
    const result = await env.DECO_CHAT_WORKSPACE_API.INTEGRATIONS_LIST({});
    return { integrations: result.items || [] };
  }
});
```

### 2. Tool to List Tools from Integration via Direct Fetch:
```typescript
const createListToolsFromIntegrationTool = (env: Env) => createTool({
  id: "LIST_TOOLS_FROM_INTEGRATION",
  description: "List tools from specific integration via direct MCP fetch",
  inputSchema: z.object({
    connection: z.object({
      type: z.string(),
      url: z.string(),
      token: z.string().optional(),
    }).describe("MCP connection object from integration")
  }),
  outputSchema: z.object({
    tools: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      inputSchema: z.any().optional(),
      outputSchema: z.any().optional()
    }))
  }),
  execute: async ({ context }) => {
    const { connection } = context;
    
    // For HTTP/SSE connections, make direct JSON-RPC call
    if (connection.type === "HTTP" || connection.type === "SSE") {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (connection.token) {
        headers["Authorization"] = `Bearer ${connection.token}`;
      }
      
      // JSON-RPC 2.0 call for tools/list
      const response = await fetch(connection.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
          id: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const tools = data.result?.tools || [];
      
      return { tools };
    }
    
    throw new Error(`Connection type ${connection.type} not supported`);
  }
});
```

### 3. Aggregator Tool that Replaces availableTools.ts:
```typescript
const createDiscoverAllToolsTool = (env: Env) => createTool({
  id: "DISCOVER_ALL_TOOLS",
  description: "Discover all available tools in workspace dynamically",
  inputSchema: z.object({}),
  outputSchema: z.object({
    tools: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      integration: z.string(),
      fullName: z.string(), // integrationId.toolName
      inputSchema: z.any().optional(),
      outputSchema: z.any().optional()
    }))
  }),
  execute: async () => {
    const allTools = [];

    // 1. Discover integrations
    const discoverIntegrations = createDiscoverIntegrationsTool(env);
    const { integrations } = await discoverIntegrations.execute({ context: {} });

    // 2. For each integration, list its tools
    const listToolsFromIntegration = createListToolsFromIntegrationTool(env);
    
    for (const integration of integrations) {
      try {
        const { tools } = await listToolsFromIntegration.execute({ 
          context: { connection: integration.connection } 
        });

        tools.forEach(tool => {
          allTools.push({
            name: tool.name,
            description: tool.description,
            integration: integration.name || integration.id,
            fullName: `${integration.id}.${tool.name}`,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema
          });
        });
      } catch (error) {
        console.warn(`Error processing integration ${integration.name}:`, error);
      }
    }

    // 3. Add local tools (SELF)
    // ... add tools from own server

    return { tools: allTools };
  }
});
```

### 4. Dynamic Tool Dispatcher:
```typescript
const createDynamicToolCallerTool = (env: Env) => createTool({
  id: "DYNAMIC_TOOL_CALL",
  description: "Execute specific tool by integrationId and toolName",
  inputSchema: z.object({
    integrationId: z.string(),
    toolName: z.string(),
    input: z.record(z.any())
  }),
  outputSchema: z.object({
    result: z.any(),
    success: z.boolean()
  }),
  execute: async ({ context }) => {
    // Use INTEGRATIONS_CALL_TOOL to execute
    const result = await env.DECO_CHAT_WORKSPACE_API.INTEGRATIONS_CALL_TOOL({
      connection: { type: "Deco", tenant: "workspace" }, // Use workspace connection
      params: {
        name: context.toolName,
        arguments: context.input
      }
    });
    
    return { result, success: true };
  }
});
```

---

## File Changes:
- `server/tools/dynamicTools.ts` (new file)
- `server/tools/index.ts` (add dynamic tools)
- `view/src/utils/availableTools.ts` (replace with hook that calls `DISCOVER_ALL_TOOLS`)
- `view/src/hooks/useDynamicTools.ts` (new hook for discovery)

## Packages:
- None new (uses native fetch)

## Acceptance Criteria:
- `DISCOVER_ALL_TOOLS` returns complete list of tools from all integrations.
- `DYNAMIC_TOOL_CALL` executes specific tool with validated input.
- System replaces static `availableTools.ts` with dynamic discovery.

## Risks:
- Initial discovery latency; mitigate with caching.
- Offline/inaccessible integrations; handle errors gracefully.
