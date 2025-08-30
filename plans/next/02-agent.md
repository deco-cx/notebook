# 2) Agent (Chat + Tools)

**Objective:** Provide an Agent in the app that responds to prompts and can trigger approved tools.

**Deliverables:**
- Server tool for Agent chat (proxying AI with schema)
- TanStack Query hook and chat UI component

**Technical Steps:**

1. **Server (Tools):**
   - Create `server/tools/agent.ts` with an `AGENT_CHAT` tool that receives `messages[]` and optionally allowed `tools`.
   - Implement proxy for `env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT` following workspace pattern.
   - Register in `server/tools/index.ts` and in `server/main.ts` within `withRuntime`.

2. **Frontend:**
   - Create hook `view/src/hooks/useAgent.ts` with `useMutation` calling `client.AGENT_CHAT`.
   - Create UI: `view/src/components/Agent/Chat.tsx` and optional route `/apps/agent` (or embed in Notebook).
   - Local persistence (optional): maintain conversation in `localStorage` per session.

**File Changes:**
- `server/tools/agent.ts`, `server/tools/index.ts`, `server/main.ts`
- `view/src/lib/rpc.ts` (already exists pattern)
- `view/src/hooks/useAgent.ts`, `view/src/components/Agent/Chat.tsx`, `view/src/routes/apps.tsx` (or dedicated route)

**Packages:**
- None new (uses existing infrastructure)

**Acceptance Criteria:**
- User sends message and receives structured Agent response (without freezing).
- Errors handled and displayed in UI.

**Risks:**
- AI provider quotas/limits; mitigate with clear error messages.

---

## 2.1) Agent Implementation Details (AI SDK 5 Context)

**Context**: Conversational agent that interacts with the current notebook via chat icon in header. Based on [AI SDK 5](https://vercel.com/blog/ai-sdk-5#agentic-loop-control) with `generateText` + `stopWhen` + native tool calling.

**Agent Architecture:**

### A) Server - `/stream` Route (AI SDK 5):

```typescript
// server/main.ts (add route handler)
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, stepCountIs, hasToolCall } from 'ai';

const handleAgentStream = async (request: Request, env: Env) => {
  const { messages, notebook, temperature = 0.3, maxSteps = 5 } = await request.json();
  
  const systemPrompt = `You are an assistant specialized in code/data notebooks.

NOTEBOOK CONTEXT:
- ID: ${notebook.id}
- Title: ${notebook.title}
- Total cells: ${notebook.cells.length}

CURRENT CELLS:
${notebook.cells.map((cell, i) => `
Cell ${i}: [${cell.type}] Status: ${cell.status}
Content: ${cell.content.slice(0, 300)}${cell.content.length > 300 ? '...' : ''}
${cell.outputs?.length ? `Outputs: ${JSON.stringify(cell.outputs.slice(0, 2))}` : 'No outputs'}
`).join('\n')}

AVAILABLE TOOLS:
- addCell: Add new cell to notebook
- updateCell: Edit existing cell content  
- deleteCell: Remove cell (if not the only one)
- runQuery: Execute SQL queries in workspace
- searchGitHub: Search issues/repos on GitHub

GUIDELINES:
- Analyze context before responding
- Use tool calls to modify notebook when requested
- Be concise but informative`;

  // Configure Anthropic model
  const model = anthropic('claude-3-5-sonnet-20241022', {
    apiKey: env.ANTHROPIC_API_KEY,
  });

  // Define available tools
  const tools = {
    addCell: tool({
      description: 'Add new cell to notebook',
      parameters: z.object({
        type: z.enum(['markdown', 'javascript', 'python', 'json', 'html']),
        content: z.string(),
        position: z.enum(['end', 'after', 'before']).optional().default('end')
      }),
      execute: async ({ type, content, position }) => {
        return { success: true, action: 'addCell', type, content, position };
      }
    }),
    
    updateCell: tool({
      description: 'Edit existing cell content',
      parameters: z.object({
        cellIndex: z.number(),
        content: z.string()
      }),
      execute: async ({ cellIndex, content }) => {
        return { success: true, action: 'updateCell', cellIndex, content };
      }
    }),
    
    deleteCell: tool({
      description: 'Remove cell from notebook',
      parameters: z.object({
        cellIndex: z.number()
      }),
      execute: async ({ cellIndex }) => {
        return { success: true, action: 'deleteCell', cellIndex };
      }
    }),
    
    runQuery: tool({
      description: 'Execute SQL query in workspace',
      parameters: z.object({
        sql: z.string(),
        params: z.array(z.any()).optional()
      }),
      execute: async ({ sql, params }) => {
        const result = await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({ sql, params });
        return { success: true, action: 'queryResult', data: result };
      }
    })
  };

  // Use streamText with stopWhen for loop control
  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools,
    temperature,
    maxTokens: 2000,
    stopWhen: [
      stepCountIs(maxSteps),
      hasToolCall('finalAnswer')
    ]
  });

  return result.toDataStreamResponse();
};

// In main handler:
const handleRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  
  if (url.pathname === '/stream' && request.method === 'POST') {
    return await handleAgentStream(request, env);
  }
  
  // ... rest of handlers
};
```

### A.1) Anthropic API Key Configuration:

```typescript
// server/main.ts or .env
// Add environment variable for Anthropic API Key
export interface Env {
  ANTHROPIC_API_KEY: string;
  // ... other vars
}

// In wrangler.toml:
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

### B) Frontend - Hook with `useChat` from AI SDK:

```typescript
// view/src/hooks/useNotebookAgent.ts
import { useChat } from 'ai/react';
import { useEffect } from 'react';

export function useNotebookAgent(notebook, onNotebookChange, cellActions) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    setMessages
  } = useChat({
    api: '/stream', // Route we created on server
    body: {
      notebook: {
        id: notebook.id,
        title: notebook.title,
        cells: notebook.cells.map(cell => ({
          id: cell.id,
          type: cell.type,
          content: cell.content,
          status: cell.status,
          outputs: cell.outputs || []
        }))
      },
      temperature: 0.3,
      maxSteps: 5
    },
    onToolCall: async ({ toolCall }) => {
      // Process tool calls in real-time during streaming
      if (toolCall.toolName === 'addCell') {
        cellActions.addCell(
          toolCall.args.type || 'markdown',
          toolCall.args.content || ''
        );
        return { success: true, message: `${toolCall.args.type} cell added` };
      } else if (toolCall.toolName === 'updateCell') {
        cellActions.updateCell(
          toolCall.args.cellIndex,
          { content: toolCall.args.content }
        );
        return { success: true, message: `Cell ${toolCall.args.cellIndex} updated` };
      } else if (toolCall.toolName === 'deleteCell') {
        cellActions.deleteCell(toolCall.args.cellIndex);
        return { success: true, message: `Cell ${toolCall.args.cellIndex} removed` };
      }
      
      // For other tools, just return success
      return { success: true };
    },
    onError: (error) => {
      console.error('Agent error:', error);
    }
  });

  const sendMessage = (content: string) => {
    append({ role: 'user', content });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
    clearChat,
    hasMessages: messages.length > 0,
    isStreaming: isLoading
  };
}
```

### C) Frontend - Agent Chat UI (with useChat):

```typescript
// view/src/components/Agent/NotebookChat.tsx
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

export function NotebookChat({ notebook, onNotebookChange, cellActions }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    clearChat,
    hasMessages
  } = useNotebookAgent(notebook, onNotebookChange, cellActions);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <MessageCircle className="h-[18px] w-[18px]" />
          {hasMessages && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-row items-center justify-between">
          <div>
            <SheetTitle>Notebook Agent</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Chat with "{notebook.title}" ({notebook.cells.length} cells)
            </p>
          </div>
          {hasMessages && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </SheetHeader>

        {/* Messages with real-time streaming */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chat with the agent about your notebook.</p>
              <p className="text-xs mt-2">I can analyze, modify cells and execute tools...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Tool calls display (AI SDK 5 format) */}
                  {message.toolInvocations?.length && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-xs opacity-70 mb-1">Actions executed:</p>
                      {message.toolInvocations.map((tool, i) => (
                        <div key={i} className="text-xs bg-background/20 rounded p-1 mb-1">
                          {tool.toolName}({Object.keys(tool.args).join(', ')})
                          {tool.result?.message && ` → ${tool.result.message}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-xs">Thinking...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              Error: {error.message}
            </div>
          )}
        </div>

        {/* Input with AI SDK submit handler */}
        <div className="flex-shrink-0 pt-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2">
            Agent with real-time streaming and automatic notebook modification.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### D) Available Tools Integration:

The agent will have access to tools from `availableTools.ts`:
- `DATABASES_RUN_SQL`: Execute queries
- `PROFILES_GET`: Get profile  
- `GITHUB_LUCIS.LIST_REPO_ISSUES`: Search issues
- `SELF.RUN_CELL`: Generate cells via AI

### E) Capabilities:
- Contextual notebook analysis
- Cell modification (add/edit/delete)
- SQL query execution
- GitHub search
- Code/visualization generation
- Analysis of existing outputs

### F) Integration in Existing Header:

```typescript
// view/src/components/site-header.tsx (lines 91-93)
// Replace:
<Button variant="ghost" size="icon" className="h-9 w-9">
  <MessageCircle className="h-[18px] w-[18px]" />
</Button>

// With:
<NotebookChat 
  notebook={currentNotebook} 
  onNotebookChange={onNotebookChange}
  cellActions={cellActions}
/>
```

### G) Complete Data Flow:

1. **User → Frontend**: Clicks chat, types message
2. **Frontend → Server**: `client.NOTEBOOK_AGENT_CHAT({ messages, notebook })`
3. **Server → AI**: Calls `AI_GENERATE_OBJECT` with notebook context + available tools
4. **AI → Server**: Returns response + tool calls (if necessary)
5. **Server → Frontend**: Returns message + tool invocations
6. **Frontend**: Applies tool invocations via `cellActions` (addCell, updateCell, deleteCell)
7. **Frontend**: Updates chat UI + modified notebook

### H) Detailed System Prompt:

```typescript
const systemPrompt = `You are an assistant specialized in code/data notebooks.

NOTEBOOK CONTEXT:
- ID: ${notebook.id}
- Title: ${notebook.title}
- Total cells: ${notebook.cells.length}

CURRENT CELLS:
${notebook.cells.map((cell, i) => `
Cell ${i}: [${cell.type}] Status: ${cell.status}
Content: ${cell.content.slice(0, 300)}${cell.content.length > 300 ? '...' : ''}
${cell.outputs?.length ? `Outputs: ${JSON.stringify(cell.outputs.slice(0, 2))}` : 'No outputs'}
`).join('\n')}

AVAILABLE TOOLS:
- addCell(type, content): Add new cell
- updateCell(cellIndex, content): Edit existing cell
- deleteCell(cellIndex): Remove cell
- runQuery(sql): Execute SQL in workspace
- searchGitHub(owner, repo, query): Search on GitHub
- getProfile(): Get user data

GUIDELINES:
- Analyze context before responding
- Suggest improvements based on current content
- Use tool calls to modify notebook when requested
- Be concise but informative
- Prioritize actions that add value to the notebook`;
```

### I) Required `RUN_CELL` Schema Update:

The current `RUN_CELL` schema in `server/tools/notebook.ts` needs to be expanded to support all available cell types:

```typescript
// server/tools/notebook.ts (update schema)
outputSchema: z.object({
  cellsToAdd: z.array(z.object({
    type: z.enum(["markdown", "javascript", "python", "html", "json", "excalidraw", "workflow"]), // Expand types
    content: z.string(),
    selectedView: z.string().optional(), // Default view for cell
    viewData: z.record(z.any()).optional() // View-specific data
  }))
}),

// Update prompt to include new types:
"RULES:\n" +
"1) Generate appropriate cells: markdown (text), javascript/python (code), html (interfaces), json (data), excalidraw (diagrams).\n" +
"2) For HTML, include scripts that use window.callTool() to access workspace tools.\n" +
"3) For visualizations, prefer HTML with Chart.js or D3.js.\n" +
"4) For diagrams, use excalidraw or HTML with SVG.\n" +
"5) Always end code with return to capture output.\n\n"
```

### J) Interaction Examples:

- **Analysis**: "Analyze data from cell 2 and create a visualization" → Generates HTML with chart
- **Code**: "Add a Python cell to plot data graph" → Generates python cell
- **Query**: "Execute SQL query and show in table" → Generates JS + HTML with table
- **GitHub**: "Search for 'auth' issues in react repo" → Generates JS with call + HTML to display
- **Diagram**: "Create a process flowchart" → Generates excalidraw cell
- **Interface**: "Create a data dashboard" → Generates interactive HTML with tools access
