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
          type: z.string(),
          content: z.string()
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
      const currentBlocks = context.notebook.cells.map(cell => ({
        type: cell.type,
        content: cell.content
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

      const prompt = `Seu trabalho é analisar um bloco markdown e gerar código JavaScript que execute o que foi solicitado.

CONTEXTO:
O usuário executou o bloco ${context.cellToRun} que contém: "${currentBlocks[context.cellToRun]?.content}"

REGRAS:
1. Se o bloco é markdown, gere APENAS código JavaScript que execute a solicitação
2. NÃO repita o conteúdo markdown - apenas implemente o que foi pedido
3. Se precisar de explicações, coloque como comentários no próprio código JavaScript
4. Use as tools disponíveis quando necessário com a sintaxe env.APP_NAME.TOOL_NAME(params)

TOOLS DISPONÍVEIS:
${workspaceTools.map(tool => `- ${tool.example.trim()}`).join('\n')}

EXEMPLOS:
- Se o markdown diz "# Buscar usuários", gere: { type: "javascript", content: "const users = await env.DATABASES.RUN_SQL({ sql: 'SELECT * FROM users' });\nconsole.log(users);" }
- Se o markdown diz "# Hello World", gere: { type: "javascript", content: "console.log('Hello World!');" }
- Se o markdown diz "# Listar repositórios", gere código que chama a API do GitHub

Gere apenas o código JavaScript necessário para executar a solicitação do bloco markdown.`;

      try {
        // Call AI_GENERATE_OBJECT through the deco platform
        const result = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
          messages: [{
            role: "user",
            content: prompt
          }],
          schema
        });

        return {
          cellsToAdd: result.object?.cellsToAdd || []
        };
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
