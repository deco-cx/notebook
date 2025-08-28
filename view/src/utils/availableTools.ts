// Available tools for the notebook application
import type { ToolDefinition } from "../types/notebook";

export const AVAILABLE_TOOLS: ToolDefinition[] = [
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
    outputSchema: `z.object({})`,
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
    outputSchema: `z.object({})`,
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
    description: "Get detailed repository metadata",
    inputSchema: `z.object({
  owner: z.string(),
  repo: z.string(),
  accessToken: z.string().optional()
})`,
    outputSchema: `z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.string(),
  clone_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number()
})`,
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
    description: "List issues from a repository with filtering options",
    inputSchema: `z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(["open", "closed", "all"]).optional(),
  labels: z.string().optional(),
  sort: z.enum(["created", "updated", "comments"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
  accessToken: z.string().optional()
})`,
    outputSchema: `z.array(z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string()
}))`,
    example: `
// Example usage in a JavaScript cell:
const issues = await env.GITHUB_LUCIS.LIST_REPO_ISSUES({
  owner: "facebook",
  repo: "react",
  state: "open",
  per_page: 10
});
console.log("Open issues:", issues);
    `
  },

  // Self Tools (RUN_CELL)
  {
    appName: "SELF",
    name: "RUN_CELL",
    fullName: "SELF.RUN_CELL",
    description: "Generate new cells using AI based on current notebook context",
    inputSchema: `z.object({
  notebook: z.object({
    cells: z.array(z.object({
      type: z.string(),
      content: z.string()
    }))
  }),
  cellToRun: z.number()
})`,
    outputSchema: `z.object({
  cellsToAdd: z.array(z.object({
    type: z.enum(["markdown", "javascript"]),
    content: z.string()
  }))
})`,
    example: `
// This tool is called internally by the notebook when running markdown cells
// It uses AI to generate new cells based on the current context
    `
  }
];
