import React from 'react';
import type { ViewApp, CellType } from '../types/notebook';
import { TipTapView } from '../components/Views/TipTapView';
import { MonacoView } from '../components/Views/MonacoView';
import { IframeView } from '../components/Views/IframeView';
import { ExcalidrawView } from '../components/Views/ExcalidrawView';

// Placeholder components - will be implemented in later phases
const WorkflowView = () => React.createElement('div', null, 'Workflow View - Coming Soon');

export const AVAILABLE_VIEWS: ViewApp[] = [
  {
    id: "tiptap",
    name: "TipTap Editor",
    description: "Rich text editor with WYSIWYG markdown editing",
    icon: "edit-3",
    supportedTypes: ["markdown"],
    component: TipTapView,
    config: {
      fullscreenCapable: true,
      hasToolbar: true,
      canEdit: true,
      canExecute: true
    }
  },
  {
    id: "monaco",
    name: "Monaco Editor",
    description: "Advanced code editor with syntax highlighting",
    icon: "code",
    supportedTypes: ["javascript", "python", "json", "html", "excalidraw"],
    component: MonacoView,
    config: {
      fullscreenCapable: true,
      hasToolbar: true,
      canEdit: true,
      canExecute: true
    }
  },
  {
    id: "excalidraw",
    name: "Excalidraw",
    description: "Collaborative whiteboard for diagrams and drawings",
    icon: "pen-tool",
    supportedTypes: ["excalidraw"],
    component: ExcalidrawView,
    config: {
      fullscreenCapable: true,
      hasToolbar: false,
      canEdit: true,
      canExecute: false
    }
  },
  {
    id: "workflow",
    name: "Workflow Designer",
    description: "Visual workflow editor with drag-and-drop interface",
    icon: "git-branch",
    supportedTypes: ["workflow"],
    component: WorkflowView,
    config: {
      fullscreenCapable: true,
      hasToolbar: true,
      canEdit: true,
      canExecute: true
    }
  },
  {
    id: "iframe-viewer",
    name: "HTML Preview",
    description: "Live HTML preview in sandboxed iframe",
    icon: "monitor",
    supportedTypes: ["html"],
    component: IframeView,
    config: {
      fullscreenCapable: true,
      hasToolbar: false,
      canEdit: false,
      canExecute: false
    }
  }
];

// View matching logic
export function getCompatibleViews(cellType: CellType): ViewApp[] {
  return AVAILABLE_VIEWS.filter(view => 
    view.supportedTypes.includes(cellType as any)
  );
}

export function getDefaultView(cellType: CellType): ViewApp | null {
  const compatible = getCompatibleViews(cellType);
  return compatible.length > 0 ? compatible[0] : null;
}
