# Deco Studio

A powerful notebook-based development environment that combines AI capabilities with interactive coding cells, built on the [Model Context Protocol (MCP)](https://spec.modelcontextprotocol.io/).

Deco Studio provides a complete development platform where you can write code, visualize data, create workflows, and interact with AI - all within a unified notebook interface. The system serves as both an MCP server for AI agents and a rich web application for interactive development.

## 📝 Development History

This repository uses [Specstory](https://specstory.com/) to track the history of
prompts that were used to code this repo. You can inspect the complete
development history in the [`.specstory/`](.specstory/) folder.

## ✨ Features

- **📓 Interactive Notebooks**: Create and manage notebooks with multiple cell types (JavaScript, Python, Markdown, HTML, JSON, Excalidraw, Workflows)
- **🤖 AI Integration**: Built-in AI tools and workflows powered by MCP protocol
- **🔧 Multi-Language Support**: Execute JavaScript, Python, and other languages in isolated cells
- **📊 Rich Visualizations**: Support for charts, diagrams, and interactive content through specialized view apps
- **🎨 Extensible Views**: Plugin system for custom cell renderers and editors (Monaco, TipTap, Excalidraw)
- **⚡ Real-time Execution**: Live code execution with output capture and error handling
- **↩️ JS Return Capture & Chaining**: JavaScript cells return values that are captured and displayed; reuse outputs via `env.getCellOutput("<id>")`
- **🧠 Markdown → AI → Code**: Run Markdown cells to generate executable JavaScript with AI, using full-notebook context
- **📏 Smart Output Omission**: Large outputs are flagged with `omitOutputToAi` to avoid sending oversized data to AI (configurable)
- **🗄️ Persistent Storage**: SQLite-based storage for notebooks, cells, and execution history
- **☁️ Cloud-Native**: Built on Cloudflare Workers with edge deployment capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js ≥22.0.0
- [Deco CLI](https://deco.chat): `deno install -Ar -g -n deco jsr:@deco/cli`

### Setup

```bash
# Install dependencies
npm install

# Configure your app
npm run configure

# Start development server
npm run dev
```

The development server will start on `http://localhost:8787`, serving both the MCP endpoints and the notebook interface. The frontend development server runs on `http://localhost:4000` during development.

## 📁 Project Structure

```
├── server/                    # MCP Server (Cloudflare Workers + Deco runtime)
│   ├── main.ts               # Server entry point with tools & workflows
│   ├── schema.ts             # Database schema definitions
│   ├── db.ts                 # Database connection and utilities
│   ├── tools/                # Domain-organized MCP tools
│   │   ├── notebook.ts       # Notebook management tools
│   │   ├── todos.ts          # Todo/task management tools
│   │   └── user.ts           # User management tools
│   ├── workflows/            # MCP workflows
│   └── deco.gen.ts           # Auto-generated integration types
└── view/                     # React Frontend (Vite + Tailwind CSS)
    ├── src/
    │   ├── components/
    │   │   ├── Notebook/     # Main notebook interface
    │   │   ├── Cell/         # Cell rendering and editing
    │   │   ├── Views/        # Specialized view apps (Monaco, TipTap, etc.)
    │   │   └── ui/           # shadcn/ui components
    │   ├── hooks/            # TanStack Query hooks for RPC calls
    │   ├── lib/rpc.ts        # Typed RPC client for server communication
    │   ├── types/            # TypeScript type definitions
    │   └── utils/            # Utility functions and configurations
    └── package.json
```

## 🛠️ Development Workflow

- **`npm run dev`** - Start development with hot reload (server + frontend)
- **`npm run gen`** - Generate types for external integrations
- **`npm run gen:self`** - Generate types for your own tools/workflows
- **`npm run db:generate`** - Generate database migrations from schema changes
- **`npm run deploy`** - Deploy to production on Cloudflare Workers

## 🔗 Architecture & Communication

Deco Studio uses a sophisticated architecture that combines notebook management, AI integration, and extensible view systems:

### Cell Types & Execution
- **JavaScript/Python**: Code cells with live execution and output capture
- **Markdown**: Rich text editing with TipTap editor and executable via AI (RUN generates JS)
- **HTML/JSON**: Structured content with syntax highlighting
- **Excalidraw**: Interactive diagram and drawing capabilities
- **Workflow**: MCP workflow integration for AI-powered automation

### View Apps System
The notebook supports pluggable view applications for different cell types:
```typescript
// Example: Monaco editor for code cells
const monacoView: ViewApp = {
  id: "monaco",
  name: "Code Editor",
  supportedTypes: ["javascript", "python", "json"],
  component: MonacoView,
  config: { canEdit: true, canExecute: true }
};
```

### Notebook Execution Model (New)

- Every JavaScript cell should end with a `return` statement. The returned value is:
  - Captured as a structured output (`json`), and
  - Also presented as a human-readable line (e.g., `Return value: 42`) directly below the cell.
- Outputs are always visible under the cell when present; no need to switch modes.
- Each cell has a 6-character ID (e.g., `a1b2c3`). You can reference previous results in new JS cells using:
  ```js
  const prev = env.getCellOutput("a1b2c3");
  // use prev here
  return prev;
  ```
- Large outputs are automatically flagged to be omitted from AI prompts when exceeding the configured limit (default 6000 chars):
  - The cell gets `omitOutputToAi: true` and shows an “AI OUTPUT OMITTED” badge.
  - You can configure the limit per notebook at `notebook.settings.outputMaxSize`.

### Running Markdown Cells with AI (New)

- Markdown cells are executable. When RUN is pressed on a Markdown cell:
  - The client sends the full notebook context (cell ids, types, content, and truncated outputs where allowed) to the server `RUN_CELL` tool.
  - The server crafts a prompt instructing AI to generate a JavaScript cell that ends with a `return <value>` and to use `env.getCellOutput("<id>")` when reusing data from other cells.
  - The generated cell(s) are inserted immediately after the markdown cell.

Example markdown workflow:
```markdown
# Get 10 users and show their names

Run this to create a JS cell that fetches data using env tools and returns an array of names.
```

Example generated JavaScript (conceptual):
```js
const rows = await env.DATABASES.RUN_SQL({ sql: "SELECT name FROM users LIMIT 10" });
const names = rows?.results?.map(r => r.name) ?? [];
return names;
```

### Referencing Previous Results

Given a previous cell with ID `x9k2mz` that returned an array, you can reuse it like this:
```js
const data = env.getCellOutput("x9k2mz");
const doubled = (data ?? []).map(n => n * 2);
return doubled;
```

### RPC Communication
Fully-typed RPC client connects the React frontend to MCP server tools:
```typescript
// Run markdown cell via AI generation
const result = await client.RUN_CELL({
  notebook: {
    cells: [
      // send cells with ids/types/content and (optionally) truncated outputs when allowed
    ]
  },
  cellToRun: 0,
});
```

## 🚀 Key Use Cases

- **Interactive Development**: Write and execute code in multiple languages with live feedback
- **AI-Powered Workflows**: Create sophisticated automation using MCP tools and AI integration
- **Data Analysis**: Combine code execution, visualizations, and rich documentation in one place
- **Collaborative Notebooks**: Share and collaborate on interactive documents with embedded code and outputs
- **Prototyping**: Rapidly prototype ideas with mixed content types (code, diagrams, documentation)

## 🔧 Extending the System

### Adding New Cell Types
```typescript
// Define new cell type in types/notebook.ts
export type CellType = "markdown" | "javascript" | "python" | "mycustomtype";

// Create corresponding view app
const customView: ViewApp = {
  id: "custom",
  name: "Custom View",
  supportedTypes: ["mycustomtype"],
  component: MyCustomComponent
};
```

### Creating MCP Tools
```typescript
// Add tools in server/tools/ directory
export const createMyTool = (env: Env) => createTool({
  id: "MY_TOOL",
  description: "Custom tool description",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ context }) => {
    // Tool implementation
    return { result: `Processed: ${context.input}` };
  }
});
```

## 📖 Learn More

Deco Studio is built on the [Deco platform](https://deco.chat/about) - a comprehensive system for building AI-powered applications with MCP integration.

- **Platform Repository**: [deco-cx/chat](https://github.com/deco-cx/chat)
- **Documentation**: [https://docs.deco.page](https://docs.deco.page)
- **MCP Protocol**: [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)

---

**Ready to build powerful notebook-based applications with AI integration?
[Get started now!](https://deco.chat)**
