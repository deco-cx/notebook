// Core types for the notebook application
import type React from 'react';

export type CellType = 
  | "markdown" 
  | "javascript" 
  | "python"
  | "html"
  | "json"
  | "excalidraw"
  | "workflow";

// Runtime array of cell types for validation
export const CELL_TYPES = [
  "markdown",
  "javascript", 
  "python",
  "html",
  "json",
  "excalidraw",
  "workflow"
] as const;

export interface Cell {
  id: string;
  type: CellType;
  content: string;
  selectedView?: string; // ID of the currently selected view app
  viewData?: Record<string, any>; // View-specific metadata/state
  outputs?: Array<{
    type: "json" | "text" | "html" | "error";
    content: string;
  }>;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    executionTime?: number;
  };
  executionTime?: number; // Keep for backward compatibility
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

// View system types
export interface ViewApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportedTypes: readonly CellType[];
  component?: React.ComponentType<ViewProps>; // For component-based views
  iframeUrl?: string; // For iframe-based views (future)
  config?: {
    fullscreenCapable: boolean;
    hasToolbar: boolean;
    canEdit: boolean;
    canExecute: boolean;
  };
}

export interface ViewProps {
  cell: Cell;
  isFullscreen: boolean;
  onContentChange: (content: string) => void;
  onViewDataChange: (data: Record<string, any>) => void;
  onToggleFullscreen: () => void;
  onExecute?: () => void;
}
