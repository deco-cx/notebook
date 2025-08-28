/**
 * Tool caller for handling frontend tool requests.
 * 
 * This file contains tools for:
 * - Proxying tool calls from the frontend to workspace integrations
 * - Handling authentication and error handling
 */
import { createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env } from "../main.ts";

export const createToolCallTool = (env: Env) =>
  createTool({
    id: "TOOL_CALL",
    description: "Proxy tool calls from frontend to workspace integrations",
    inputSchema: z.object({
      toolName: z.string(),
      params: z.any()
    }),
    outputSchema: z.object({
      result: z.any(),
      error: z.string().optional()
    }),
    execute: async ({ context }) => {
      const { toolName, params } = context;

      try {
        console.log(`PROXYING_TOOL_CALL: ${toolName}`, params);

        // Route to appropriate integration based on tool name
        if (toolName === 'DATABASES_RUN_SQL') {
          const result = await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL(params);
          return { result };
        }
        
        if (toolName === 'PROFILES_GET') {
          const result = await env.DECO_CHAT_WORKSPACE_API.PROFILES_GET(params);
          return { result };
        }
        
        if (toolName === 'TEAMS_LIST') {
          const result = await env.DECO_CHAT_WORKSPACE_API.TEAMS_LIST(params);
          return { result };
        }
        
        if (toolName === 'TEAMS_GET_THEME') {
          const result = await env.DECO_CHAT_WORKSPACE_API.TEAMS_GET_THEME(params);
          return { result };
        }
        
        if (toolName === 'GITHUB_LUCIS.GET_REPO') {
          const result = await env.GITHUB_LUCIS.GET_REPO(params);
          return { result };
        }
        
        if (toolName === 'GITHUB_LUCIS.LIST_REPO_ISSUES') {
          const result = await env.GITHUB_LUCIS.LIST_REPO_ISSUES(params);
          return { result };
        }

        // Add more tool mappings as needed
        
        return {
          error: `Unknown tool: ${toolName}`
        };
        
      } catch (error) {
        console.error(`TOOL_CALL_ERROR for ${toolName}:`, error);
        return {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
  });

export const toolCallerTools = [
  createToolCallTool,
];
