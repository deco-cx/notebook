# Browser-Based Jupyter Notebook with Deco Tools Integration

## Project Overview

Create a Jupyter-Notebook-like application that runs entirely in the browser with the following key features:
- Browser-based execution environment (extensible to other environments)
- Integration with Deco workspace tools via API calls
- AI-powered cell generation from markdown input
- Beautiful UI rendering capabilities
- Variable reference system for inter-cell communication
- File upload and management system

## Core Architecture

### Cell System
```typescript
interface Cell {
  id: string;
  type: "markdown" | "html" | "javascript" | "json";
  content: string;
  outputs?: Array<{
    type: "json" | "text" | "html";
    content: string;
  }>;
}

interface Notebook {
  id: string;
  path: string; // e.g., "/2025/jan/27/index.json"
  cells: Cell[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    title?: string;
  };
}
```

### Filesystem Emulation
- Browser-based filesystem using IndexedDB
- Automatic path generation based on current date: `/YYYY/MMM/DD/index.json`
- Support for file uploads and references

### Tool Integration
- Direct fetch calls to Deco API from browser
- Authentication handled via cookies/session
- Variable system to pass data between cells without bloating AI context

## MVP Implementation Plan (Focus on Working Version)

### Core MVP Features (Week 1-2)
The goal is to create a minimal but functional notebook that can:
1. Create and edit cells (markdown, javascript)
2. Execute JavaScript cells in the browser
3. Call the two essential tools: `DATABASES_RUN_SQL` and `PROFILES_GET`
4. Display outputs
5. Save/load notebooks from browser storage

### MVP Architecture Decisions
- **No complex variable system**: Use cell outputs directly
- **Two tools only**: Start with SQL and user profile
- **Simple UI**: Focus on functionality over polish
- **Browser storage**: Use localStorage for MVP (IndexedDB later)
- **No AI initially**: Add AI generation in Phase 2

## Phase 1: Core Infrastructure (Week 1-2)

### 1.1 Project Setup (MVP)
- [ ] Initialize React + TypeScript project with Vite
- [ ] Setup Tailwind CSS for styling
- [ ] Create basic project structure
- [ ] Setup localStorage for notebook persistence (simple)

### 1.2 Cell System Foundation (MVP)
- [ ] Create `Cell` component with type switching
- [ ] Implement MVP cell renderers:
  - [ ] Markdown renderer (simple textarea + preview)
  - [ ] JavaScript executor with `env` global available
- [ ] Add basic cell management (add, delete)
- [ ] Implement simple output display

#### JavaScript Execution Environment
```typescript
// utils/executeJavaScript.ts
export async function executeJavaScript(code: string): Promise<any> {
  // Create execution environment with env global
  const env = createExecutionEnvironment();
  
  try {
    // Create async function with env in scope
    const asyncFunction = new Function('env', `
      return (async () => {
        ${code}
      })();
    `);
    
    const result = await asyncFunction(env);
    return result;
  } catch (error) {
    throw new Error(`Execution error: ${error.message}`);
  }
}
```

### 1.3 Notebook Management (MVP)
- [ ] Create `Notebook` component
- [ ] Implement simple localStorage persistence
- [ ] Basic save/load functionality
- [ ] Single notebook for MVP (expand later)

### 1.4 Available Tools
Essential tools for the notebook application:

```typescript
// utils/availableTools.ts
export const AVAILABLE_TOOLS = [
  {
    appName: "DATABASES",
    name: "RUN_SQL",
    fullName: "DATABASES_RUN_SQL",
    description: "Run a SQL query against the workspace database",
    inputSchema: `z.object({
  sql: z.string(),
  params: z.array(z.unknown()).optional(),
  _legacy: z.boolean().optional()
})`,
    outputSchema: `z.object({
  result: z.array(z.object({
    meta: z.object({
      changed_db: z.boolean().optional(),
      changes: z.number().optional(),
      duration: z.number().optional(),
      last_row_id: z.number().optional(),
      rows_read: z.number().optional(),
      rows_written: z.number().optional()
    }).optional(),
    results: z.array(z.unknown()).optional(),
    success: z.boolean().optional()
  }))
})`,
    example: `
// Example usage in a JavaScript cell:
const result = await env.DATABASES.RUN_SQL({
  sql: "SELECT * FROM users LIMIT 10"
});
console.log(result);
    `
  },
  {
    appName: "PROFILES",
    name: "GET", 
    fullName: "PROFILES_GET",
    description: "Get the current user's profile",
    inputSchema: `z.object({})`,
    outputSchema: `z.object({})`, // Note: Empty in deco.gen.ts, needs actual schema
    example: `
// Example usage in a JavaScript cell:
const user = await env.PROFILES.GET({});
console.log("Current user:", user);
    `
  },
  {
    appName: "TEAMS",
    name: "GET_THEME",
    fullName: "TEAMS_GET_THEME",
    description: "Get the theme for a workspace",
    inputSchema: `z.object({
  slug: z.string()
})`,
    outputSchema: `z.object({})`, // Note: Empty in deco.gen.ts, needs actual schema
    example: `
// Example usage in a JavaScript cell:
const theme = await env.TEAMS.GET_THEME({
  slug: "my-workspace"
});
console.log("Workspace theme:", theme);
    `
  },
  {
    appName: "TEAMS",
    name: "LIST",
    fullName: "TEAMS_LIST",
    description: "List teams for the current user",
    inputSchema: `z.object({})`,
    outputSchema: `z.object({
  items: z.array(z.unknown())
})`,
    example: `
// Example usage in a JavaScript cell:
const teams = await env.TEAMS.LIST({});
console.log("User teams:", teams.items);
    `
  },

  // GitHub Tools
  {
    appName: "GITHUB_LUCIS",
    name: "GET_REPO",
    fullName: "GITHUB_LUCIS.GET_REPO",
    description: "Get detailed metadata for a repository",
    inputSchema: `z.object({
  owner: z.string(),
  repo: z.string()
})`,
    outputSchema: `z.object({})`,
    example: `
// Example usage in a JavaScript cell:
const repo = await env.GITHUB_LUCIS.GET_REPO({
  owner: "facebook",
  repo: "react"
});
console.log("Repository info:", repo);
    `
  },
  {
    appName: "GITHUB_LUCIS",
    name: "LIST_REPO_ISSUES",
    fullName: "GITHUB_LUCIS.LIST_REPO_ISSUES",
    description: "List issues from a GitHub repository",
    inputSchema: `z.object({
  repoIdentify: z.object({
    owner: z.string().optional(),
    repo: z.string().optional(),
    url: z.string().optional()
  }),
  issueFilters: z.object({
    state: z.string().optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
    labels: z.string().optional(),
    issueNumber: z.number().optional()
  })
})`,
    outputSchema: `z.object({})`,
    example: `
// Example usage in a JavaScript cell:
const issues = await env.GITHUB_LUCIS.LIST_REPO_ISSUES({
  repoIdentify: { owner: "facebook", repo: "react" },
  issueFilters: { state: "open", per_page: 10 }
});
console.log("Open issues:", issues);
    `
  },
  {
    appName: "GITHUB_LUCIS",
    name: "CREATE_ISSUE",
    fullName: "GITHUB_LUCIS.CREATE_ISSUE",
    description: "Create a new issue in a GitHub repository",
    inputSchema: `z.object({
  repoIdentify: z.object({
    owner: z.string().optional(),
    repo: z.string().optional(),
    url: z.string().optional()
  }),
  title: z.string(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional()
})`,
    outputSchema: `z.object({
  created: z.boolean(),
  number: z.number(),
  url: z.string(),
  title: z.string(),
  body: z.string(),
  labels: z.array(z.string()),
  user: z.string(),
  created_at: z.string(),
  message: z.string()
})`,
    example: `
// Example usage in a JavaScript cell:
const newIssue = await env.GITHUB_LUCIS.CREATE_ISSUE({
  repoIdentify: { owner: "myorg", repo: "myrepo" },
  title: "Bug report",
  body: "Description of the issue",
  labels: ["bug", "priority-high"]
});
console.log("Created issue:", newIssue);
    `
  },
  {
    appName: "GITHUB_LUCIS",
    name: "GET_REPO_FILE_CONTENT",
    fullName: "GITHUB_LUCIS.GET_REPO_FILE_CONTENT",
    description: "Get the content of a file from a GitHub repository",
    inputSchema: `z.object({
  owner: z.string(),
  repo: z.string(),
  path: z.string()
})`,
    outputSchema: `z.object({})`,
    example: `
// Example usage in a JavaScript cell:
const fileContent = await env.GITHUB_LUCIS.GET_REPO_FILE_CONTENT({
  owner: "facebook",
  repo: "react",
  path: "README.md"
});
console.log("File content:", fileContent);
    `
  },
  {
    appName: "GITHUB_LUCIS",
    name: "LIST_REPO_COMMITS",
    fullName: "GITHUB_LUCIS.LIST_REPO_COMMITS",
    description: "List commits for a repository",
    inputSchema: `z.object({
  owner: z.string(),
  repo: z.string(),
  since: z.string().optional(),
  until: z.string().optional(),
  per_page: z.number().optional(),
  page: z.number().optional()
})`,
    outputSchema: `z.object({})`,
    example: `
// Example usage in a JavaScript cell:
const commits = await env.GITHUB_LUCIS.LIST_REPO_COMMITS({
  owner: "facebook",
  repo: "react",
  per_page: 10
});
console.log("Recent commits:", commits);
    `
  },
  {
    appName: "GITHUB_LUCIS",
    name: "GET_USER",
    fullName: "GITHUB_LUCIS.GET_USER",
    description: "Get the authenticated GitHub user",
    inputSchema: `z.object({
  accessToken: z.string().optional()
})`,
    outputSchema: `z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string(),
  url: z.string(),
  html_url: z.string(),
  type: z.string(),
  site_admin: z.boolean()
})`,
    example: `
// Example usage in a JavaScript cell:
const user = await env.GITHUB_LUCIS.GET_USER({});
console.log("GitHub user:", user);
    `
  },

  // AI Tools (Server-side only)
  {
    appName: "SELF",
    name: "RUN_CELL",
    fullName: "SELF.RUN_CELL",
    description: "Generate new notebook cells using AI based on user input and current notebook context",
    inputSchema: `z.object({
  notebook: z.object({
    cells: z.array(z.object({
      type: z.string(),
      content: z.string()
    }))
  }),
  cellToRun: z.number(),
  availableTools: z.array(z.object({
    appName: z.string(),
    name: z.string(),
    fullName: z.string(),
    description: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string(),
    example: z.string()
  }))
})`,
    outputSchema: `z.object({
  cellsToAdd: z.array(z.object({
    type: z.enum(["markdown", "javascript"]),
    content: z.string()
  }))
})`,
    example: `
// This tool is called automatically when running markdown cells
// It generates new cells based on the notebook context and user input
// Not directly callable from JavaScript cells
    `
  }
];
```

## Phase 2: Tool Integration & Basic AI (Week 3)

### 2.1 Tool Call System
- [ ] Create `ToolCaller` utility class
- [ ] Implement authentication handling
- [ ] Create tool call UI components
- [ ] Add error handling and retry logic

```typescript
// utils/toolCaller.ts
class ToolCaller {
  async callTool(appName: string, toolName: string, params: any): Promise<any> {
    const response = await fetch("https://api.deco.chat/mcp", {
      method: "POST",
      headers: {
        "accept": "application/json, text/event-stream",
        "content-type": "application/json", 
        "mcp-protocol-version": "2025-06-18",
      },
      credentials: "include",
      body: JSON.stringify({
        method: "tools/call",
        params: {
          name: "INTEGRATIONS_CALL_TOOL",
          arguments: {
            connection: {
              type: "HTTP",
              url: `https://api.deco.chat/shared/lucis/mcp?group=${appName}`
            },
            params: {
              name: toolName,
              arguments: params
            }
          }
        },
        jsonrpc: "2.0",
        id: Math.random()
      })
    });
    
    return await response.json();
  }
}

// Global env object for JavaScript cell execution
export function createExecutionEnvironment() {
  const toolCaller = new ToolCaller();
  
  return {
    DATABASES: {
      RUN_SQL: (params: any) => toolCaller.callTool("databases-management", "DATABASES_RUN_SQL", params)
    },
    TEAMS: {
      GET_THEME: (params: any) => toolCaller.callTool("teams", "TEAMS_GET_THEME", params),
      LIST: (params: any) => toolCaller.callTool("teams", "TEAMS_LIST", params)
    },
    PROFILES: {
      GET: (params: any) => toolCaller.callTool("profiles", "PROFILES_GET", params)
    }
  };
}
```

### 2.2 Cell Output Access
- [ ] Simple output referencing via cell IDs
- [ ] Basic cell execution order management
- [ ] Output display and formatting

### 2.3 RUN_CELL Tool (Server-Side AI Integration)
- [ ] Create server-side `RUN_CELL` tool that proxies `AI_GENERATE_OBJECT`
- [ ] Implement frontend RPC call to `RUN_CELL` tool
- [ ] Create specific schema for cell generation
- [ ] Implement Portuguese prompt system for cell analysis

#### Server-Side RUN_CELL Tool Implementation
```typescript
// server/main.ts - Add this tool to your server
const createRunCellTool = (env: Env) =>
  createTool({
    id: "RUN_CELL",
    description: "Generate new notebook cells using AI based on user input and current notebook context",
    inputSchema: z.object({
      notebook: z.object({
        cells: z.array(z.object({
          type: z.string(),
          content: z.string()
        }))
      }),
      cellToRun: z.number(),
      availableTools: z.array(z.object({
        appName: z.string(),
        name: z.string(),
        fullName: z.string(),
        description: z.string(),
        inputSchema: z.string(),
        outputSchema: z.string(),
        example: z.string()
      }))
    }),
    outputSchema: z.object({
      cellsToAdd: z.array(z.object({
        type: z.enum(["markdown", "javascript"]),
        content: z.string()
      }))
    }),
    execute: async ({ context }) => {
      const { notebook, cellToRun, availableTools } = context;
      
      const currentBlocks = notebook.cells.map(cell => ({
        type: cell.type,
        content: cell.content
      }));

      const schema = {
        type: "object",
        properties: {
          cellsToAdd: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["markdown", "javascript"],
                  description: "Type of cell to create"
                },
                content: {
                  type: "string", 
                  description: "Content for the cell. For markdown: write explanatory text, documentation, or analysis. For javascript: write executable code that can call workspace tools using env.APP_NAME.TOOL_NAME(params). Available tools are provided in the context with their app names and examples."
                }
              },
              required: ["type", "content"]
            },
            description: "Array of new cells to add to the notebook"
          }
        },
        required: ["cellsToAdd"]
      };

      const prompt = `Seu trabalho é analisar blocos de uma cadeia de comandos.

Você deve decidir quais novos blocos devem ser adicionados na esteira a depender do pedido do usuário.

Os blocos atuais são: ${JSON.stringify(currentBlocks, null, 2)}

Você pode criar um bloco:
- markdown: { type: "markdown", content: string } - Para explicações, documentação, análise
- javascript: { type: "javascript", content: string } - Para código executável

O código que você vai gerar rodará num ambiente onde há tools disponíveis para serem chamadas com env.APP_NAME.TOOL_NAME(params).

As tools disponíveis para chamar são: 
${JSON.stringify(availableTools, null, 2)}

IMPORTANTE: Use sempre a sintaxe env.APP_NAME.TOOL_NAME(params) para chamar as tools. Por exemplo:
- env.DATABASES.RUN_SQL({ sql: "SELECT * FROM users" })
- env.TEAMS.LIST({})
- env.PROFILES.GET({})

Analise o pedido do usuário no bloco ${cellToRun} e gere os blocos apropriados.`;

      // Proxy to AI_GENERATE_OBJECT through deco platform
      const result = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: [{
          role: "user",
          content: prompt
        }],
        schema: schema,
        temperature: 0.3,
        maxTokens: 2000
      });

      return {
        cellsToAdd: result.object?.cellsToAdd || []
      };
    },
  });

// Register the tool in withRuntime
const { Workflow, ...runtime } = withRuntime<Env>({
  workflows: [/* your workflows */],
  tools: [/* other tools */, createRunCellTool],
  fetch: fallbackToView("/"),
});
```

#### Frontend RPC Call to RUN_CELL
```typescript
// utils/runCell.ts - Frontend implementation
import { client } from './rpc';
import { AVAILABLE_TOOLS } from './availableTools';

export async function runCell(notebook: Notebook, cellToRun: number) {
  try {
    const result = await client.RUN_CELL({
      notebook: {
        cells: notebook.cells.map(cell => ({
          type: cell.type,
          content: cell.content
        }))
      },
      cellToRun,
      availableTools: AVAILABLE_TOOLS.map(tool => ({
        appName: tool.appName,
        name: tool.name,
        fullName: tool.fullName,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        example: tool.example
      }))
    });

    return result.cellsToAdd || [];
  } catch (error) {
    console.error('RUN_CELL failed:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}
```

## Application Layout (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser Jupyter Notebook                      │
├─────────────────────────────────────────────────────────────────────────┤
│ File: /2025/jan/27/index.json                                 [Save] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Cell 1: markdown                                        [▼] [Run] │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ # Data Analysis                                                     │ │
│ │ Let's analyze the user data from our database                       │ │
│ │                                                                     │ │
│ │ [Edit] [Preview] [Raw]                                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Cell 2: javascript                                      [▼] [Run] │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ const users = await env.DATABASES.RUN_SQL({                         │ │
│ │   sql: "SELECT * FROM users LIMIT 10"                               │ │
│ │ });                                                                 │ │
│ │ console.log(users);                                                 │ │
│ │                                                                     │ │
│ │ [Edit] [Execute] [Output]                                           │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ Output:                                                             │ │
│ │ { result: [{ results: [{ id: 1, name: "John" }, ...] }] }          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Cell 3: markdown                                        [▼] [Run] │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ Show me a chart of user registrations by month                      │ │
│ │                                                                     │ │
│ │ [Edit] [Preview] [Raw]                                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [+ Add Cell] [+ Add Markdown] [+ Add JavaScript]                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Keyboard Shortcuts:
- Cmd + Enter: Run current cell
- Shift + Enter: Run cell and move to next
- Ctrl + M: Add markdown cell
- Ctrl + J: Add javascript cell
```

## Cell Renders Architecture

### Render Modes
Each cell supports multiple render modes that can be toggled:

```typescript
// types/renders.ts
export type RenderMode = "edit" | "preview" | "output" | "raw";

export interface CellRenderer {
  mode: RenderMode;
  component: React.ComponentType<CellRenderProps>;
  label: string;
  icon: string;
}

export interface CellRenderProps {
  cell: Cell;
  onContentChange: (content: string) => void;
  onRun: () => void;
  isRunning: boolean;
}
```

### Render Types by Cell Type

#### Markdown Cell Renders
1. **Edit Mode** - Simple textarea for editing
2. **Preview Mode** - Rendered markdown with react-markdown
3. **Raw Mode** - Plain text view with syntax highlighting

#### JavaScript Cell Renders  
1. **Edit Mode** - Code editor (textarea with syntax highlighting)
2. **Execute Mode** - Code editor with run capability
3. **Output Mode** - Shows execution results
4. **Raw Mode** - Plain text view

#### Future: HTML Cell Renders
1. **Edit Mode** - HTML code editor
2. **Preview Mode** - Rendered HTML in sandboxed iframe
3. **Raw Mode** - HTML source view

### Render Implementation

```typescript
// components/Cell/renderers/index.ts
export const CELL_RENDERERS: Record<CellType, CellRenderer[]> = {
  markdown: [
    {
      mode: "edit",
      component: MarkdownEditRenderer,
      label: "Edit",
      icon: "edit"
    },
    {
      mode: "preview", 
      component: MarkdownPreviewRenderer,
      label: "Preview",
      icon: "eye"
    },
    {
      mode: "raw",
      component: RawTextRenderer,
      label: "Raw", 
      icon: "code"
    }
  ],
  javascript: [
    {
      mode: "edit",
      component: JavaScriptEditRenderer,
      label: "Edit",
      icon: "edit"
    },
    {
      mode: "output",
      component: JavaScriptOutputRenderer,
      label: "Execute",
      icon: "play"
    },
    {
      mode: "raw",
      component: RawTextRenderer,
      label: "Raw",
      icon: "code"
    }
  ]
};
```

### Cell Component with Render Switching

```typescript
// components/Cell/Cell.tsx
export function Cell({ cell, onUpdate, onRun }: CellProps) {
  const [currentMode, setCurrentMode] = useState<RenderMode>("edit");
  const [isRunning, setIsRunning] = useState(false);
  
  const renderers = CELL_RENDERERS[cell.type];
  const currentRenderer = renderers.find(r => r.mode === currentMode);
  
  const handleRun = async () => {
    setIsRunning(true);
    try {
      if (cell.type === "markdown") {
        // Call RUN_CELL for AI generation
        const newCells = await runCell(notebook, cellIndex);
        onAddCells(newCells);
      } else if (cell.type === "javascript") {
        // Execute JavaScript with env available
        const result = await executeJavaScript(cell.content);
        onUpdate({ ...cell, outputs: [{ type: "json", content: JSON.stringify(result) }] });
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="cell border rounded-lg p-4 mb-4">
      <div className="cell-header flex justify-between items-center mb-2">
        <div className="cell-type">
          Cell {cellIndex + 1}: {cell.type}
        </div>
        <div className="cell-actions flex gap-2">
          <select 
            value={currentMode} 
            onChange={(e) => setCurrentMode(e.target.value as RenderMode)}
            className="text-sm border rounded px-2 py-1"
          >
            {renderers.map(renderer => (
              <option key={renderer.mode} value={renderer.mode}>
                {renderer.label}
              </option>
            ))}
          </select>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      
      <div className="cell-content">
        {currentRenderer && (
          <currentRenderer.component
            cell={cell}
            onContentChange={(content) => onUpdate({ ...cell, content })}
            onRun={handleRun}
            isRunning={isRunning}
          />
        )}
      </div>
    </div>
  );
}
```

## Styling: Industrial/Construction Aesthetic

### Design Philosophy: "Exposed Infrastructure"
The application should look like a **construction site** or **server room** where you can see all the working parts - emphasizing that this is a functional prototype, not a polished product.

#### Visual Elements:
- **Monospace fonts everywhere** (Fira Code, JetBrains Mono, or Consolas)
- **Terminal/console color scheme**: Dark backgrounds with bright text
- **Exposed borders and grids**: Show the underlying structure
- **Industrial colors**: Grays, oranges (construction), greens (terminal), yellows (warnings)
- **Raw data display**: JSON outputs shown as-is, no pretty formatting initially
- **Visible metadata**: Show cell IDs, execution times, memory usage
- **Construction-style labels**: "CELL_001", "OUTPUT_BUFFER", "EXEC_STATUS"

#### CSS Theme Concept:
```css
/* Construction Site Theme */
:root {
  --bg-primary: #1a1a1a;        /* Dark concrete */
  --bg-secondary: #2d2d2d;      /* Steel gray */
  --border-main: #ff6b35;       /* Construction orange */
  --text-primary: #f0f0f0;      /* Bright white */
  --text-secondary: #a0a0a0;    /* Muted gray */
  --accent-success: #00ff41;    /* Terminal green */
  --accent-warning: #ffff00;    /* Safety yellow */
  --accent-error: #ff0040;      /* Alert red */
  --font-mono: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
}

.cell {
  border: 2px solid var(--border-main);
  background: var(--bg-secondary);
  font-family: var(--font-mono);
  position: relative;
}

.cell::before {
  content: "CELL_" attr(data-cell-id);
  position: absolute;
  top: -10px;
  left: 10px;
  background: var(--border-main);
  color: var(--bg-primary);
  padding: 2px 8px;
  font-size: 10px;
  font-weight: bold;
}

.output {
  background: #000;
  color: var(--accent-success);
  border-left: 4px solid var(--accent-success);
  font-family: var(--font-mono);
}

.toolbar {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-main);
  padding: 8px;
}

.run-button {
  background: var(--border-main);
  color: var(--bg-primary);
  border: none;
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-weight: bold;
  text-transform: uppercase;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-idle { background: var(--text-secondary); }
.status-running { background: var(--accent-warning); animation: blink 1s infinite; }
.status-success { background: var(--accent-success); }
.status-error { background: var(--accent-error); }

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}
```

#### UI Labels & Text:
- "NOTEBOOK_INSTANCE_001"
- "EXEC_ENV_READY"
- "TOOL_REGISTRY_LOADED"
- "OUTPUT_BUFFER"
- "CELL_EXEC_TIME: 234ms"
- "MEM_USAGE: 12.4MB"
- "API_CALLS: 3/100"

#### Component Examples:
```jsx
// Cell header with industrial styling
<div className="cell-header">
  <span className="cell-id">CELL_{cellId.padStart(3, '0')}</span>
  <span className="cell-type">[{cell.type.toUpperCase()}]</span>
  <span className="status-indicator status-idle"></span>
  <span className="exec-time">EXEC: {executionTime}ms</span>
  <button className="run-button">► RUN</button>
</div>

// Output with terminal styling
<div className="output-container">
  <div className="output-header">
    OUTPUT_BUFFER [{timestamp}]
  </div>
  <pre className="output-content">{JSON.stringify(output, null, 2)}</pre>
</div>
```

This aesthetic will:
1. **Set expectations**: Users know this is a prototype/POC
2. **Show transparency**: All the working parts are visible
3. **Feel powerful**: Like using developer tools or terminal
4. **Be functional**: Focus on usability over beauty
5. **Stand out**: Unique visual identity that's memorable

## Phase 3: Core Features Implementation (Week 4)

### 3.1 File Upload System
- [ ] Drag & drop file upload
- [ ] File reference cell creation
- [ ] CSV/JSON preview
- [ ] File management UI

## Phase 4: Advanced Features (Week 5+)

### 4.1 Enhanced UI
- [ ] Menu system with daily notebooks
- [ ] Rich markdown renderer with syntax highlighting
- [ ] Beautiful JSON tree viewer
- [ ] Keyboard shortcuts

### 4.2 More Tools
- [ ] Add more essential tools from deco.gen.ts
- [ ] Tool documentation and examples
- [ ] Error handling improvements

### 4.3 Future Enhancements
- [ ] Multiple notebook management
- [ ] Export functionality
- [ ] Performance optimizations
- [ ] Plugin system for custom renderers

## Technical Stack

### Frontend (MVP)
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Markdown** for markdown rendering
- **localStorage** for persistence (MVP)

### Key Libraries (MVP)
- `react-markdown` - Markdown rendering
- `lucide-react` - Icons
- `clsx` - Conditional CSS classes

## File Structure (MVP)
```
src/
├── components/
│   ├── Cell/
│   │   ├── Cell.tsx
│   │   ├── MarkdownCell.tsx
│   │   └── JavaScriptCell.tsx
│   ├── Notebook/
│   │   ├── Notebook.tsx
│   │   └── CellList.tsx
│   └── UI/
│       └── Button.tsx
├── utils/
│   ├── storage.ts (localStorage wrapper)
│   ├── toolCaller.ts
│   └── availableTools.ts
├── hooks/
│   ├── useNotebook.ts
│   └── useToolCalls.ts
├── types/
│   ├── notebook.ts
│   └── cell.ts
└── App.tsx (single page for MVP)
```

## Success Metrics (MVP)

1. **Core Functionality**
   - [ ] Can create and edit markdown/javascript cells
   - [ ] Can execute JavaScript cells with `env.TOOL_NAME()` calls
   - [ ] Can call `DATABASES_RUN_SQL` and `PROFILES_GET` from cells
   - [ ] Can run `RUN_CELL` to generate new cells using AI

2. **User Experience**
   - [ ] Simple cell management (add, delete, edit)
   - [ ] Clear output display
   - [ ] Basic save/load functionality
   - [ ] Markdown preview works

3. **AI Integration Quality**
   - [ ] `AI_GENERATE_OBJECT` calls work reliably
   - [ ] Generated cells are syntactically correct
   - [ ] Portuguese prompts generate appropriate responses
   - [ ] Tool context is properly included in prompts

## Risks & Mitigations

1. **Browser Security Limitations**
   - Risk: JavaScript execution security
   - Mitigation: Sandboxed execution, content security policies

2. **Tool Call Authentication**
   - Risk: Session management complexity
   - Mitigation: Robust error handling, token refresh

3. **Performance with Large Notebooks**
   - Risk: Memory usage, slow rendering
   - Mitigation: Virtual scrolling, lazy loading

4. **AI Code Generation Quality**
   - Risk: Generated code doesn't work
   - Mitigation: Extensive tool documentation, examples

## Next Steps

1. Start with Phase 1: Core Infrastructure
2. Create basic cell system and notebook management
3. Implement tool integration
4. Add AI-powered cell generation
5. Polish UI and add advanced features

This plan provides a solid foundation for building a powerful, browser-based notebook application that leverages the full power of the Deco ecosystem while maintaining the flexibility and interactivity that makes Jupyter notebooks so popular.
