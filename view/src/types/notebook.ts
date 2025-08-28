// Core types for the notebook application

export interface Cell {
  id: string;
  type: "markdown" | "javascript";
  content: string;
  outputs?: Array<{
    type: "json" | "text" | "html";
    content: string;
  }>;
  executionTime?: number;
  status?: "idle" | "running" | "success" | "error";
}

export interface Notebook {
  id: string;
  path: string; // e.g., "/2025/jan/27/index.json"
  cells: Cell[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolDefinition {
  appName: string;
  name: string;
  fullName: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  example: string;
}
