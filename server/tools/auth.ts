/**
 * Authentication-related tools for user management and workspace access.
 * 
 * This file contains tools for:
 * - Authentication status checking
 * - User profile management
 * - Workspace information retrieval
 */
import { createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env } from "../main.ts";

export const createGetAuthStatusTool = (env: Env) =>
  createTool({
    id: "GET_AUTH_STATUS",
    description: "Get current authentication status and user info",
    inputSchema: z.object({}),
    outputSchema: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().optional()
      }).optional(),
      workspace: z.object({
        id: z.string(),
        name: z.string()
      }).optional(),
      isLoggedIn: z.boolean()
    }),
    execute: async ({ context, runtimeContext }) => {
      console.log("GET_AUTH_STATUS called with context:", context);
      
      try {
        // Try to check if user is authenticated using the request context
        const user = env.DECO_CHAT_REQUEST_CONTEXT?.getUser?.();
        
        if (user) {
          console.log("User found via request context:", user.email);
          
          try {
            // Try to get workspace info
            const workspaceInfo = await env.DECO_CHAT_WORKSPACE_API.WORKSPACE_GET({});
            
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name
              },
              workspace: {
                id: workspaceInfo.id || 'unknown',
                name: workspaceInfo.name || 'Unknown Workspace'
              },
              isLoggedIn: true
            };
          } catch (workspaceError) {
            console.log("Workspace info failed:", workspaceError.message);
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name
              },
              workspace: {
                id: 'unknown',
                name: 'Unknown Workspace'
              },
              isLoggedIn: true
            };
          }
        }
        
        console.log("No user found in request context, user is logged out");
      } catch (error) {
        console.log("Auth check failed (expected for logged-out users):", error.message);
      }

      return { 
        user: undefined,
        workspace: undefined,
        isLoggedIn: false 
      };
    }
  });

export const authTools = [
  createGetAuthStatusTool,
];

