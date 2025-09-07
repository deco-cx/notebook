/**
 * Notebook-related tools for browser-based Jupyter notebook functionality.
 * 
 * This file contains tools for:
 * - AI-powered cell generation
 * - Notebook execution and management
 * - CRUD operations for notebook persistence
 * - Daily note management
 */
import { createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import { eq, desc, like, and, or, count } from "drizzle-orm";
import { getDb } from "../db.ts";
import { notebooksTable } from "../schema.ts";
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
        "2) NÃO envolva o código em funções. Escreva o código diretamente no nível superior (top-level).\n" +
        "3) Use await diretamente para chamadas assíncronas. Exemplo: const data = await env.DATABASES.RUN_SQL(...);\n" +
        "4) O código DEVE terminar com return <valor> para capturar o resultado principal.\n" +
        "5) Para reutilizar dados de outras células, chame env.getCellOutput(\"<id>\").\n" +
        "6) Não repita markdown em texto; implemente diretamente o pedido em JS.\n\n" +
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

export const createSaveNotebookTool = (env: Env) =>
  createTool({
    id: "SAVE_NOTEBOOK",
    description: "Save or update a notebook to the database",
    inputSchema: z.object({
      notebook: z.object({
        id: z.string(),
        title: z.string(),
        cells: z.array(z.any()),
        tags: z.array(z.string()).default([]),
        description: z.string().optional()
      }),
      userId: z.string().optional(),
      workspaceId: z.string().optional()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      notebookId: z.string(),
      message: z.string()
    }),
    execute: async ({ context }) => {
      // For logged-out users, just return success without saving
      if (!context.userId) {
        return {
          success: true,
          notebookId: context.notebook.id,
          message: "Login to save notebooks permanently"
        };
      }

      try {
        const db = await getDb(env);
        const now = new Date();
        const notebookData = {
          id: context.notebook.id,
          title: context.notebook.title,
          content: JSON.stringify(context.notebook.cells),
          userId: context.userId || null,
          workspaceId: context.workspaceId || null,
          tags: JSON.stringify(context.notebook.tags),
          description: context.notebook.description || null,
          updatedAt: now,
          lastAccessedAt: now,
        };

        // Check if notebook exists
        const existing = await db.select()
          .from(notebooksTable)
          .where(eq(notebooksTable.id, context.notebook.id))
          .limit(1);

        if (existing.length > 0) {
          // Update existing notebook
          await db.update(notebooksTable)
            .set(notebookData)
            .where(eq(notebooksTable.id, context.notebook.id));
          
          return {
            success: true,
            notebookId: context.notebook.id,
            message: "Notebook updated successfully"
          };
        } else {
          // Create new notebook
          await db.insert(notebooksTable).values({
            ...notebookData,
            createdAt: now,
          });
          
          return {
            success: true,
            notebookId: context.notebook.id,
            message: "Notebook created successfully"
          };
        }
      } catch (error) {
        console.error("Error saving notebook:", error);
        return {
          success: false,
          notebookId: context.notebook.id,
          message: `Failed to save notebook: ${error.message}`
        };
      }
    },
  });

export const createListNotebooksTool = (env: Env) =>
  createTool({
    id: "LIST_NOTEBOOKS",
    description: "List notebooks with pagination and filtering",
    inputSchema: z.object({
      userId: z.string().optional(),
      workspaceId: z.string().optional(),
      page: z.number().default(0),
      limit: z.number().default(20),
      search: z.string().optional(),
      includePublic: z.boolean().default(true)
    }),
    outputSchema: z.object({
      notebooks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        cellCount: z.number(),
        tags: z.array(z.string()),
        updatedAt: z.string(),
        isTemplate: z.boolean(),
        isPublic: z.boolean(),
        description: z.string().optional()
      })),
      pagination: z.object({
        total: z.number(),
        hasMore: z.boolean(),
        page: z.number(),
        limit: z.number()
      })
    }),
    execute: async ({ context }) => {
      // Check if user is authenticated first
      if (!context.userId) {
        // Return empty list for logged-out users
        return {
          notebooks: [],
          pagination: {
            total: 0,
            hasMore: false,
            page: context.page,
            limit: context.limit
          }
        };
      }

      try {
        const db = await getDb(env);
        const offset = context.page * context.limit;
        
        // Build where conditions
        const conditions = [];
        
        if (context.userId) {
          if (context.includePublic) {
            conditions.push(
              or(
                eq(notebooksTable.userId, context.userId),
                eq(notebooksTable.isPublic, 1)
              )
            );
          } else {
            conditions.push(eq(notebooksTable.userId, context.userId));
          }
        } else if (context.includePublic) {
          conditions.push(eq(notebooksTable.isPublic, 1));
        }
        
        if (context.workspaceId) {
          conditions.push(eq(notebooksTable.workspaceId, context.workspaceId));
        }
        
        if (context.search) {
          conditions.push(
            or(
              like(notebooksTable.title, `%${context.search}%`),
              like(notebooksTable.description, `%${context.search}%`)
            )
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get notebooks with pagination
        const notebooks = await db.select()
          .from(notebooksTable)
          .where(whereClause)
          .orderBy(desc(notebooksTable.updatedAt))
          .limit(context.limit)
          .offset(offset);

        // Get total count
        const totalResult = await db.select({ count: count() })
          .from(notebooksTable)
          .where(whereClause);
        
        const total = totalResult[0]?.count || 0;

        // Process notebooks
        const processedNotebooks = notebooks.map(notebook => {
          let cells = [];
          try {
            cells = JSON.parse(notebook.content || '[]');
          } catch (e) {
            cells = [];
          }
          
          let tags = [];
          try {
            tags = JSON.parse(notebook.tags || '[]');
          } catch (e) {
            tags = [];
          }

          return {
            id: notebook.id,
            title: notebook.title,
            cellCount: Array.isArray(cells) ? cells.length : 0,
            tags,
            updatedAt: notebook.updatedAt?.toISOString() || new Date().toISOString(),
            isTemplate: Boolean(notebook.isTemplate),
            isPublic: Boolean(notebook.isPublic),
            description: notebook.description || undefined
          };
        });

        return {
          notebooks: processedNotebooks,
          pagination: {
            total,
            hasMore: offset + context.limit < total,
            page: context.page,
            limit: context.limit
          }
        };
      } catch (error) {
        console.error("Error listing notebooks:", error);
        return {
          notebooks: [],
          pagination: {
            total: 0,
            hasMore: false,
            page: context.page,
            limit: context.limit
          }
        };
      }
    },
  });

export const createGetNotebookTool = (env: Env) =>
  createTool({
    id: "GET_NOTEBOOK",
    description: "Get a specific notebook by ID",
    inputSchema: z.object({
      notebookId: z.string(),
      userId: z.string().optional()
    }),
    outputSchema: z.object({
      notebook: z.object({
        id: z.string(),
        title: z.string(),
        cells: z.array(z.any()),
        tags: z.array(z.string()),
        description: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
        isTemplate: z.boolean(),
        isPublic: z.boolean()
      }).optional(),
      found: z.boolean()
    }),
    execute: async ({ context }) => {
      // Return not found for logged-out users
      if (!context.userId) {
        return { found: false };
      }

      try {
        const db = await getDb(env);
        const notebooks = await db.select()
          .from(notebooksTable)
          .where(eq(notebooksTable.id, context.notebookId))
          .limit(1);

        if (notebooks.length === 0) {
          return { found: false };
        }

        const notebook = notebooks[0];
        
        // Check access permissions
        if (context.userId && notebook.userId && notebook.userId !== context.userId && !notebook.isPublic) {
          return { found: false };
        }

        // Update last accessed time
        await db.update(notebooksTable)
          .set({ lastAccessedAt: new Date() })
          .where(eq(notebooksTable.id, context.notebookId));

        let cells = [];
        try {
          cells = JSON.parse(notebook.content || '[]');
        } catch (e) {
          cells = [];
        }
        
        let tags = [];
        try {
          tags = JSON.parse(notebook.tags || '[]');
        } catch (e) {
          tags = [];
        }

        return {
          notebook: {
            id: notebook.id,
            title: notebook.title,
            cells,
            tags,
            description: notebook.description || undefined,
            createdAt: notebook.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: notebook.updatedAt?.toISOString() || new Date().toISOString(),
            isTemplate: Boolean(notebook.isTemplate),
            isPublic: Boolean(notebook.isPublic)
          },
          found: true
        };
      } catch (error) {
        console.error("Error getting notebook:", error);
        return { found: false };
      }
    },
  });

export const createGetOrCreateDailyNoteTool = (env: Env) =>
  createTool({
    id: "GET_OR_CREATE_DAILY_NOTE",
    description: "Get or create today's daily note",
    inputSchema: z.object({
      userId: z.string().optional(),
      workspaceId: z.string().optional()
    }),
    outputSchema: z.object({
      notebook: z.object({
        id: z.string(),
        title: z.string(),
        cells: z.array(z.any())
      }),
      created: z.boolean()
    }),
    execute: async ({ context }) => {
      // Return a default daily note for logged-out users
      if (!context.userId) {
        const today = new Date().toISOString().split('T')[0];
        const dailyNoteTitle = `Daily Note - ${today}`;
        
        return {
          notebook: {
            id: `daily-${today}`,
            title: dailyNoteTitle,
            cells: [
              {
                id: `daily-${Date.now()}-1`,
                type: 'markdown',
                content: `# ${dailyNoteTitle}\n\n## Today's Tasks\n\n- [ ] \n\n## Notes\n\n> **Note:** Login to save your daily notes permanently!`,
                selectedView: 'tiptap',
                status: 'idle',
                outputs: []
              }
            ]
          },
          created: true
        };
      }

      try {
        const db = await getDb(env);
        const today = new Date().toISOString().split('T')[0];
        const dailyNoteId = `daily-${today}${context.userId ? `-${context.userId}` : ''}`;
        
        // Check if daily note exists
        const existing = await db.select()
          .from(notebooksTable)
          .where(eq(notebooksTable.id, dailyNoteId))
          .limit(1);

        if (existing.length > 0) {
          const notebook = existing[0];
          let cells = [];
          try {
            cells = JSON.parse(notebook.content || '[]');
          } catch (e) {
            cells = [];
          }

          return {
            notebook: {
              id: notebook.id,
              title: notebook.title,
              cells
            },
            created: false
          };
        }

        // Create new daily note
        const now = new Date();
        const dailyNoteTitle = `Daily Note - ${today}`;
        const dailyNoteCells = [
          {
            id: `daily-${Date.now()}-1`,
            type: 'markdown',
            content: `# ${dailyNoteTitle}\n\n## Today's Tasks\n\n- [ ] \n\n## Notes\n\n`,
            selectedView: 'tiptap',
            status: 'idle',
            outputs: []
          }
        ];

        await db.insert(notebooksTable).values({
          id: dailyNoteId,
          title: dailyNoteTitle,
          content: JSON.stringify(dailyNoteCells),
          userId: context.userId || null,
          workspaceId: context.workspaceId || null,
          isTemplate: 0,
          isPublic: 0,
          tags: JSON.stringify(['daily']),
          description: `Daily note for ${today}`,
          createdAt: now,
          updatedAt: now,
          lastAccessedAt: now,
        });

        return {
          notebook: {
            id: dailyNoteId,
            title: dailyNoteTitle,
            cells: dailyNoteCells
          },
          created: true
        };
      } catch (error) {
        console.error("Error creating daily note:", error);
        throw new Error(`Failed to create daily note: ${error.message}`);
      }
    },
  });

export const createDeleteNotebookTool = (env: Env) =>
  createTool({
    id: "DELETE_NOTEBOOK",
    description: "Delete a notebook by ID",
    inputSchema: z.object({
      notebookId: z.string(),
      userId: z.string().optional()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);
      
      try {
        // Check if notebook exists and user has permission
        const existing = await db.select()
          .from(notebooksTable)
          .where(eq(notebooksTable.id, context.notebookId))
          .limit(1);

        if (existing.length === 0) {
          return {
            success: false,
            message: "Notebook not found"
          };
        }

        const notebook = existing[0];
        
        // Check ownership (only owner can delete)
        if (context.userId && notebook.userId && notebook.userId !== context.userId) {
          return {
            success: false,
            message: "Permission denied"
          };
        }

        await db.delete(notebooksTable)
          .where(eq(notebooksTable.id, context.notebookId));

        return {
          success: true,
          message: "Notebook deleted successfully"
        };
      } catch (error) {
        console.error("Error deleting notebook:", error);
        return {
          success: false,
          message: `Failed to delete notebook: ${error.message}`
        };
      }
    },
  });

export const notebookTools = [
  createRunCellTool,
  createSaveNotebookTool,
  createListNotebooksTool,
  createGetNotebookTool,
  createGetOrCreateDailyNoteTool,
  createDeleteNotebookTool,
];
