import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/rpc";
import { useAuth } from "./useAuth";

// Hook for getting a specific notebook
export const useGetNotebook = (notebookId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["notebook", notebookId],
    queryFn: () => client.GET_NOTEBOOK({ 
      notebookId, 
      userId: user?.id 
    }),
    enabled: !!notebookId,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });
};

// Hook for listing notebooks with pagination
export const useListNotebooks = (options: {
  page?: number;
  limit?: number;
  search?: string;
  includePublic?: boolean;
} = {}) => {
  const { user, workspace } = useAuth();
  
  return useQuery({
    queryKey: ["notebooks", "list", user?.id, workspace?.id, options],
    queryFn: () => client.LIST_NOTEBOOKS({
      userId: user?.id,
      workspaceId: workspace?.id,
      page: options.page || 0,
      limit: options.limit || 20,
      search: options.search,
      includePublic: options.includePublic ?? true
    }),
    staleTime: 60 * 1000, // Consider fresh for 1 minute
  });
};

// Hook for saving/updating notebooks
export const useSaveNotebook = () => {
  const queryClient = useQueryClient();
  const { user, workspace } = useAuth();
  
  return useMutation({
    mutationFn: (notebook: {
      id: string;
      title: string;
      cells: any[];
      tags?: string[];
      description?: string;
    }) => client.SAVE_NOTEBOOK({
      notebook: {
        ...notebook,
        tags: notebook.tags || []
      },
      userId: user?.id,
      workspaceId: workspace?.id
    }),
    onSuccess: (data, variables) => {
      // Invalidate and refetch notebook lists
      queryClient.invalidateQueries({ queryKey: ["notebooks", "list"] });
      
      // Update the specific notebook cache
      queryClient.setQueryData(["notebook", variables.id], {
        notebook: variables,
        found: true
      });
    },
  });
};

// Hook for deleting notebooks
export const useDeleteNotebook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notebookId: string) => client.DELETE_NOTEBOOK({
      notebookId,
      userId: user?.id
    }),
    onSuccess: (data, notebookId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["notebook", notebookId] });
      
      // Invalidate notebook lists
      queryClient.invalidateQueries({ queryKey: ["notebooks", "list"] });
    },
  });
};

// Hook for getting or creating daily note
export const useGetOrCreateDailyNote = () => {
  const { user, workspace } = useAuth();
  
  return useQuery({
    queryKey: ["dailyNote", user?.id, workspace?.id],
    queryFn: () => client.GET_OR_CREATE_DAILY_NOTE({
      userId: user?.id,
      workspaceId: workspace?.id
    }),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    enabled: !!user, // Only run when user is logged in
  });
};
