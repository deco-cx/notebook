/**
 * Notebook-related tools for browser-based Jupyter notebook functionality.
 * 
 * This file contains tools for:
 * - AI-powered cell generation
 * - Notebook execution and management
 */
import { createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env } from "../main.ts";

export const createRunCellTool = (env: Env) =>
  createTool({
    id: "RUN_CELL",
    description: "Generate new cells using AI based on current notebook context",
    inputSchema: z.object({
      notebook: z.object({
        cells: z.array(z.object({
          id: z.string().optional(),
          type: z.string(),
          content: z.string(),
          omitOutputToAi: z.boolean().optional(),
          outputs: z.array(z.object({
            type: z.enum(["json", "text", "html", "error"]).optional(),
            content: z.string().optional(),
          })).optional()
        }))
      }),
      cellToRun: z.number()
    }),
    outputSchema: z.object({
      cellsToAdd: z.array(z.object({
        type: z.enum(["markdown", "javascript"]),
        content: z.string()
      }))
    }),
    execute: async ({ context }) => {
      const max = 6000;
      const notebookContext = context.notebook.cells.map((cell, idx) => ({
        idx,
        id: (cell as any).id,
        type: cell.type,
        content: String(cell.content || '').slice(0, 2000),
        outputs: (cell as any).omitOutputToAi ? undefined : ((cell as any).outputs?.map((o: any) => ({
          type: o.type,
          content: String(o.content ?? '').slice(0, max)
        })) ?? undefined)
      }));

      // Available tools for the AI context
      const workspaceTools = [
        {
          appName: "DATABASES",
          name: "RUN_SQL",
          fullName: "DATABASES_RUN_SQL",
          description: "Run a SQL query against the workspace database",
          example: 'const result = await env.DATABASES.RUN_SQL({ sql: "SELECT * FROM users LIMIT 10" });'
        },
        {
          appName: "PROFILES",
          name: "GET",
          fullName: "PROFILES_GET", 
          description: "Get the current user's profile",
          example: 'const user = await env.PROFILES.GET({});'
        },
        {
          appName: "TEAMS",
          name: "LIST",
          fullName: "TEAMS_LIST",
          description: "List teams for the current user",
          example: 'const teams = await env.TEAMS.LIST({});'
        },
        {
          appName: "TEAMS",
          name: "GET_THEME",
          fullName: "TEAMS_GET_THEME",
          description: "Get the theme for a workspace",
          example: 'const theme = await env.TEAMS.GET_THEME({ slug: "my-workspace" });'
        },
        {
          appName: "GITHUB_LUCIS",
          name: "GET_REPO",
          fullName: "GITHUB_LUCIS.GET_REPO",
          description: "Get detailed repository metadata",
          example: 'const repo = await env.GITHUB_LUCIS.GET_REPO({ owner: "facebook", repo: "react" });'
        },
        {
          appName: "GITHUB_LUCIS",
          name: "LIST_REPO_ISSUES",
          fullName: "GITHUB_LUCIS.LIST_REPO_ISSUES",
          description: "List issues from a repository",
          example: 'const issues = await env.GITHUB_LUCIS.LIST_REPO_ISSUES({ owner: "facebook", repo: "react", state: "open" });'
        }
      ];

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

      const cellRun = context.notebook.cells[context.cellToRun];
      const prompt = "" +
        "Você é um gerador de código para células JavaScript dentro de um Notebook.\n\n" +
        "CONTEXT0: NOTEBOOK COMPLETO (cells com type, content e outputs, estes truncados e omitidos quando indicado)\n" +
        JSON.stringify(notebookContext) + "\n\n" +
        "CONTEXT1: CÉLULA ACIONADA\n" +
        `Index: ${context.cellToRun}\n` +
        `ID: ${(cellRun as any)?.id}\n` +
        `Tipo: ${cellRun?.type}\n` +
        `Conteúdo: ${cellRun?.content}\n\n` +
        "REGRAS:\n" +
        "1) Se a célula acionada for markdown, gere APENAS uma nova célula { type: \"javascript\", content: \"...\" }.\n" +
        "2) O código gerado DEVE terminar com um return <valor> representando o resultado principal (esse valor será capturado como output da célula).\n" +
        "3) Para reutilizar dados de outras células, chame env.getCellOutput(\"<id>\").\n" +
        "4) Para usar ferramentas, chame env.APP.TOOL(params) conforme exemplos abaixo.\n" +
        "5) Não repita markdown em texto; implemente diretamente o pedido em JS.\n\n" +
        "TOOLS DISPONÍVEIS:\n" +
        workspaceTools.map(tool => `- ${tool.example.trim()}`).join('\n');

      try {
        // Call AI_GENERATE_OBJECT through the deco platform
        const result = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
          messages: [{
            role: "user",
            content: prompt
          }],
          schema
        });

        const raw = (result as any)?.object?.cellsToAdd;
        const cellsToAdd: { type: "markdown" | "javascript"; content: string }[] = Array.isArray(raw)
          ? raw.flatMap((c: any) => {
              const t = c?.type;
              const content = c?.content;
              if ((t === "markdown" || t === "javascript") && typeof content === "string") {
                return [{ type: t, content }];
              }
              return [];
            })
          : [];

        return { cellsToAdd };
      } catch (error) {
        console.error("AI_GENERATE_OBJECT error:", error);
        return {
          cellsToAdd: []
        };
      }
    },
  });

export const notebookTools = [
  createRunCellTool,
];
