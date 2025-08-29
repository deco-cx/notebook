# Excalidraw Integration Guide: Lessons Learned from Wedbraw

A comprehensive guide to integrating Excalidraw as a library in React applications, with all the pitfalls, solutions, and best practices learned during the Wedbraw development.

## Table of Contents

1. [Overview](#overview)
2. [Critical Issues and Solutions](#critical-issues-and-solutions)
3. [Required Dependencies and Setup](#required-dependencies-and-setup)
4. [State Management Patterns](#state-management-patterns)
5. [Persistence and Auto-Save](#persistence-and-auto-save)
6. [AI Integration](#ai-integration)
7. [Custom Embeddables](#custom-embeddables)
8. [Performance Optimization](#performance-optimization)
9. [Working Code Examples](#working-code-examples)
10. [Best Practices](#best-practices)

## Overview

Excalidraw is a powerful drawing library, but integrating it properly requires careful attention to state management, persistence, and performance. This guide documents all the issues we encountered and how to solve them.

**Key Learnings:**
- Excalidraw manages its own state internally
- Infinite render loops are common if not handled properly
- CSS imports are critical for proper rendering
- AI integration requires careful element property preservation
- Auto-save must be debounced and optimized

## Critical Issues and Solutions

### 1. Infinite Render Loops 🔄

**Problem**: Maximum update depth exceeded errors, components re-rendering 100+ times.

**Root Cause**: Store updates triggering onChange handlers which trigger more store updates.

**Solution**: Use refs and selective subscriptions to break the loop.

```typescript
// ❌ WRONG: Causes infinite loops
const { api, elements, markDirty } = useCanvasStore();

useEffect(() => {
  if (!api) return;
  const cleanup = api.onChange((elements, appState) => {
    markDirty(); // This causes re-render → new effect → new handler
  });
  return cleanup;
}, [api, markDirty]); // Dependencies cause re-registration

// ✅ CORRECT: Prevents loops
const api = useCanvasStore(state => state.api); // Selective subscription

useEffect(() => {
  if (!api) return;
  
  const cleanup = api.onChange((elements, appState) => {
    // Use getState() to avoid dependencies
    const { markDirty } = useCanvasStore.getState();
    markDirty();
  });
  
  return cleanup;
}, [api]); // Only depend on api
```

### 2. Missing CSS Styles 🎨

**Problem**: Elements render as huge boxes, links oversized.

**Root Cause**: Excalidraw CSS not imported.

**Solution**: Import Excalidraw CSS and add custom styles.

```typescript
// ✅ Required imports
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css"; // CRITICAL!
```

```css
/* Custom styles for better integration */
.excalidraw {
  --lg-button-size: 40px;
  --button-size: 40px;
}

.excalidraw .App {
  width: 100%;
  height: 100%;
}

/* Fix for embeddable elements */
.excalidraw .excalidraw-iframe-container,
.excalidraw .excalidraw-embeddable-container {
  max-width: 100%;
  max-height: 100%;
}
```

### 3. Collaborators Error 👥

**Problem**: `props.appState.collaborators.forEach is not a function`

**Root Cause**: Excalidraw expects `collaborators` to be a Map, but we're passing other types.

**Solution**: Always ensure proper appState structure.

```typescript
// ✅ Safe appState structure
const safeAppState = {
  ...appState,
  collaborators: new Map(), // Always use Map
  selectedElementIds: appState.selectedElementIds || {},
};

api.updateScene({
  elements: drawingData.elements || [],
  appState: safeAppState,
});
```

### 4. URL Parameter Issues 🔗

**Problem**: Parameters passed as quoted strings in URL (`isNew=%22true%22`).

**Root Cause**: Passing strings instead of proper types in TanStack Router.

**Solution**: Use proper types and schema validation.

```typescript
// ❌ WRONG: String values
navigate({ 
  to: "/editor", 
  search: { 
    isNew: "true" // Creates quoted string in URL
  } 
});

// ✅ CORRECT: Boolean values
navigate({ 
  to: "/editor", 
  search: { 
    isNew: true // Creates clean boolean in URL
  } 
});

// Route schema with proper handling
const editorSearchSchema = z.object({
  id: z.union([
    z.number(),
    z.string().transform(val => parseInt(val))
  ]).optional(),
  isNew: z.union([
    z.boolean(),
    z.string().transform(val => val === "true")
  ]).optional().default(false),
});
```

## Required Dependencies and Setup

### Essential Packages

```json
{
  "@excalidraw/excalidraw": "^0.17.6",
  "zustand": "^4.4.0",
  "use-debounce": "^10.0.0",
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-router": "^1.0.0"
}
```

### CSS Imports

```typescript
// In your main component
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css"; // MUST HAVE

// In main.tsx or styles
import "./styles/excalidraw.css"; // Custom styles
```

## State Management Patterns

### Zustand Store Structure

```typescript
// Optimized store structure
interface CanvasStore {
  // Core Excalidraw state
  api: ExcalidrawImperativeAPI | null;
  elements: readonly ExcalidrawElement[];
  selectedElementIds: Set<string>;
  
  // App metadata
  currentDrawing: DrawingMetadata | null;
  
  // Actions (keep simple)
  setAPI: (api: ExcalidrawImperativeAPI) => void;
  updateElements: (elements: readonly ExcalidrawElement[]) => void;
  updateSelectedElements: (selectedIds: Set<string>) => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    api: null,
    elements: [],
    selectedElementIds: new Set(),
    currentDrawing: null,
    
    // Simple actions
    setAPI: (api) => set({ api }),
    updateElements: (elements) => set({ elements }),
    updateSelectedElements: (selectedIds) => set({ selectedElementIds: selectedIds }),
    
    // Optimized dirty tracking
    markDirty: () => set((state) => 
      state.currentDrawing 
        ? { currentDrawing: { ...state.currentDrawing, isDirty: true } }
        : {}
    ),
  }))
);
```

### Component Integration

```typescript
// ✅ Use selective subscriptions to prevent re-renders
export function ExcalidrawCanvas() {
  // Selective subscriptions (not destructuring)
  const api = useCanvasStore(state => state.api);
  const currentDrawing = useCanvasStore(state => state.currentDrawing);
  const setAPI = useCanvasStore(state => state.setAPI);
  
  return (
    <div className="h-screen w-full relative">
      <Excalidraw
        excalidrawAPI={(api) => setAPI(api)}
        renderEmbeddable={renderCustomEmbeddable}
        validateEmbeddable={validateCustomEmbeddable}
      />
    </div>
  );
}
```

## Persistence and Auto-Save

### Simplified Persistence Hook

```typescript
/**
 * Optimized persistence - no state interference
 */
export function usePersistence() {
  const api = useCanvasStore(state => state.api);
  const updateElements = useCanvasStore(state => state.updateElements);
  const updateSelectedElements = useCanvasStore(state => state.updateSelectedElements);
  
  // Debounced save (3 seconds for better UX)
  const saveToLocalStorage = useDebouncedCallback(
    (elements: any[], appState: any) => {
      const drawingName = useCanvasStore.getState().currentDrawing?.name || "untitled";
      const key = `wedbraw-${drawingName}`;
      const data = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          // Only save essential appState properties
        },
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    3000 // 3 seconds debounce
  );
  
  // Single onChange registration
  useEffect(() => {
    if (!api) return;
    
    const cleanup = api.onChange((elements: any[], appState: any) => {
      // Update store for AI integration
      updateElements(elements);
      updateSelectedElements(new Set(Object.keys(appState.selectedElementIds || {})));
      
      // Save to localStorage (non-blocking)
      saveToLocalStorage(elements, appState);
    });
    
    return cleanup;
  }, [api, updateElements, updateSelectedElements, saveToLocalStorage]);
}
```

### Loading Saved Drawings

```typescript
// Simple loading from localStorage
export function loadFromLocalStorage(drawingName: string) {
  const key = `wedbraw-${drawingName}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

// Loading in component
useEffect(() => {
  if (api && !isNew && drawingName) {
    const saved = loadFromLocalStorage(drawingName);
    if (saved && saved.elements) {
      api.updateScene({
        elements: saved.elements,
        appState: {
          ...saved.appState,
          collaborators: new Map(), // Always use Map
        },
      });
    }
  }
}, [api, isNew, drawingName]);
```

## AI Integration

### Server-Side AI Tool

```typescript
export const createCanvasAITool = (env: Env) =>
  createTool({
    id: "PROCESS_CANVAS_WITH_AI",
    description: "Process selected canvas elements with AI",
    inputSchema: z.object({
      selectedElements: z.array(z.object({
        id: z.string(),
        type: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        text: z.string().optional(),
        backgroundColor: z.string().optional(),
        strokeColor: z.string().optional(),
        points: z.array(z.any()).optional(), // For linear elements
      })),
      canvasContext: z.object({
        allElements: z.array(z.any()),
        viewport: z.object({
          x: z.number(),
          y: z.number(),
          zoom: z.number(),
        }),
      }),
      userPrompt: z.string(),
    }),
    outputSchema: z.object({
      newElements: z.array(z.object({
        type: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        text: z.string().optional(),
        backgroundColor: z.string().optional(),
        strokeColor: z.string().optional(),
      })),
      modifications: z.array(z.object({
        elementId: z.string(),
        backgroundColor: z.string().optional(),
        strokeColor: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        // ... other properties
      })),
    }),
    execute: async ({ context }) => {
      // Build detailed context with exact IDs
      const elementsContext = context.selectedElements.map(el => 
        `Element ID: "${el.id}" - ${el.type} at position (${el.x}, ${el.y}) with size ${el.width}x${el.height}, backgroundColor: ${el.backgroundColor}, strokeColor: ${el.strokeColor}`
      ).join('\n');

      const responseSchema = {
        type: "object",
        properties: {
          modifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                elementId: { 
                  type: "string", 
                  description: "EXACT ID of element to modify from the selected elements" 
                },
                backgroundColor: { type: "string" },
                strokeColor: { type: "string" },
                // ... other properties
              },
              required: ["elementId"]
            }
          }
        }
      };

      const aiResponse = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for Excalidraw. When modifying elements, you MUST use the exact element ID provided.

IMPORTANT: Use the EXACT elementId from the selected elements list. Do NOT generate your own IDs.`
          },
          {
            role: "user",
            content: `${elementsContext}\n\nUser request: "${context.userPrompt}"`
          }
        ],
        schema: responseSchema,
        temperature: 0.7,
        maxTokens: 2000,
      });

      return aiResponse.object;
    },
  });
```

### Client-Side AI Processing

```typescript
// Applying AI modifications safely
if (result.modifications?.length > 0) {
  const updatedElements = elements.map(el => {
    const modification = result.modifications.find(mod => {
      // Try exact ID match first
      if (mod.elementId === el.id) return true;
      
      // Fallback: apply to selected elements if ID doesn't match
      return selectedElementIds.has(el.id);
    });
    
    if (modification) {
      // Preserve ALL existing properties
      const updated = {
        ...el, // Keep everything
        // Only override specific properties
        ...(modification.backgroundColor !== undefined && { backgroundColor: modification.backgroundColor }),
        ...(modification.strokeColor !== undefined && { strokeColor: modification.strokeColor }),
        // Update version tracking
        updated: Date.now(),
        versionNonce: Math.floor(Math.random() * 2000000000),
      };
      return updated;
    }
    return el;
  });

  // Apply changes with error handling
  try {
    api.updateScene({ elements: updatedElements });
    api.refresh();
  } catch (updateError) {
    console.error("Failed to update scene:", updateError);
    api.updateScene({ elements: updatedElements });
  }
}
```

## Custom Embeddables

### Deco App Embedding

```typescript
// Embeddable renderer for Deco apps
function renderDecoAppEmbeddable(element: any) {
  if (element.link?.includes('.deco.page')) {
    return (
      <div className="deco-app-embed border-2 border-indigo-200 rounded-lg overflow-hidden bg-white">
        <iframe
          src={element.link}
          width={element.width}
          height={element.height - 24} // Reserve space for header
          frameBorder="0"
          title={`Deco App: ${element.link}`}
          className="w-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        <div className="bg-indigo-50 px-2 py-1 border-t border-indigo-200">
          <span className="text-xs text-indigo-700 font-medium">
            📱 {element.link.replace('https://', '').replace('.deco.page', '')}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

// Validator
function validateDecoAppEmbeddable(link: string) {
  try {
    const url = new URL(link);
    return url.hostname.endsWith('.deco.page');
  } catch {
    return false;
  }
}

// Usage in Excalidraw
<Excalidraw
  renderEmbeddable={renderDecoAppEmbeddable}
  validateEmbeddable={validateDecoAppEmbeddable}
/>
```

### Creating Embeddable Elements

```typescript
const handleEmbedDecoApp = (appUrl: string) => {
  if (!api) return;

  const fullUrl = appUrl.includes('.deco.page') 
    ? appUrl 
    : `https://${appUrl}.deco.page`;

  const embeddableElement = {
    id: `deco-app-${Date.now()}`,
    type: "embeddable" as const,
    x: 100,
    y: 100,
    width: 600,
    height: 400,
    angle: 0,
    strokeColor: "#6366f1",
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    strokeWidth: 2,
    strokeStyle: "solid" as const,
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 1 as const },
    seed: Math.floor(Math.random() * 1000000),
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: fullUrl,
    locked: false,
    validated: true,
  };

  api.updateScene({
    elements: [...api.getSceneElements(), embeddableElement],
  });
};
```

## Performance Optimization

### Debouncing Best Practices

```typescript
// ✅ Optimal debouncing for different use cases
const saveToLocalStorage = useDebouncedCallback(
  (elements, appState) => {
    // Save logic here
  },
  3000 // 3 seconds - gives time for continuous drawing
);

// For database saves (when implemented)
const saveToDB = useDebouncedCallback(
  async (elements, appState) => {
    // Database save logic
  },
  5000 // 5 seconds - less frequent for external saves
);
```

### Preventing Unnecessary Updates

```typescript
// Only update when values actually change
updateSelectedElements: (selectedIds) => {
  const current = get().selectedElementIds;
  // Only update if selection actually changed
  if (current.size !== selectedIds.size || 
      [...current].some(id => !selectedIds.has(id))) {
    set({ selectedElementIds: selectedIds });
  }
},

// Only mark dirty when not already dirty
markDirty: () => {
  const state = get();
  if (state.currentDrawing && !state.currentDrawing.isDirty) {
    set({
      currentDrawing: { ...state.currentDrawing, isDirty: true }
    });
  }
},
```

## Working Code Examples

### Complete Canvas Component

```typescript
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCanvasStore } from "../lib/store";
import { useEffect, useState } from "react";
import { usePersistence, loadFromLocalStorage } from "../hooks/usePersistence";

interface ExcalidrawCanvasProps {
  drawingId?: number;
  drawingName: string;
  folder: string;
  isNew: boolean;
}

export function ExcalidrawCanvas({ drawingId, drawingName, folder, isNew }: ExcalidrawCanvasProps) {
  // Selective subscriptions to prevent re-renders
  const api = useCanvasStore(state => state.api);
  const setAPI = useCanvasStore(state => state.setAPI);
  const setCurrentDrawing = useCanvasStore(state => state.setCurrentDrawing);
  const reset = useCanvasStore(state => state.reset);
  
  // Set current drawing metadata
  useEffect(() => {
    setCurrentDrawing({
      id: drawingId,
      name: drawingName,
      folder,
      isNew,
      isDirty: false,
    });
    
    return () => reset();
  }, [drawingId, drawingName, folder, isNew, setCurrentDrawing, reset]);

  // Load drawing from localStorage
  useEffect(() => {
    if (api && !isNew && drawingName) {
      const saved = loadFromLocalStorage(drawingName);
      if (saved && saved.elements) {
        api.updateScene({
          elements: saved.elements,
          appState: {
            ...saved.appState,
            collaborators: new Map(),
          },
        });
      }
    }
  }, [api, isNew, drawingName]);

  // Use persistence hook
  usePersistence();

  return (
    <div className="h-screen w-full relative">
      <Excalidraw
        excalidrawAPI={(api) => setAPI(api)}
        renderEmbeddable={renderDecoAppEmbeddable}
        validateEmbeddable={validateDecoAppEmbeddable}
      />
    </div>
  );
}
```

### AI Controls Component

```typescript
export function AIControls() {
  const elements = useCanvasStore(state => state.elements);
  const selectedElementIds = useCanvasStore(state => state.selectedElementIds);
  const api = useCanvasStore(state => state.api);
  const aiPrompt = useCanvasStore(state => state.aiPrompt);
  const setAIPrompt = useCanvasStore(state => state.setAIPrompt);
  
  const selectedElements = elements.filter(el => selectedElementIds.has(el.id));
  const hasSelection = selectedElements.length > 0;

  const handleAIProcess = async () => {
    if (!hasSelection || !aiPrompt.trim() || !api) return;

    const result = await processCanvasAI.mutateAsync({
      selectedElements: selectedElements.map(el => ({
        id: el.id,
        type: el.type,
        x: el.x || 0,
        y: el.y || 0,
        width: el.width || 0,
        height: el.height || 0,
        text: (el as any).text || "",
        backgroundColor: el.backgroundColor || "transparent",
        strokeColor: el.strokeColor || "#000000",
        points: (el as any).points || [], // For linear elements
      })),
      canvasContext: {
        allElements: elements,
        viewport: {
          x: api.getAppState().scrollX || 0,
          y: api.getAppState().scrollY || 0,
          zoom: api.getAppState().zoom?.value || 1,
        },
      },
      userPrompt: aiPrompt.trim(),
    });

    // Apply modifications preserving all properties
    if (result.modifications?.length > 0) {
      const updatedElements = elements.map(el => {
        const modification = result.modifications.find(mod => 
          mod.elementId === el.id || selectedElementIds.has(el.id)
        );
        
        if (modification) {
          return {
            ...el, // Preserve ALL existing properties
            ...(modification.backgroundColor !== undefined && { backgroundColor: modification.backgroundColor }),
            ...(modification.strokeColor !== undefined && { strokeColor: modification.strokeColor }),
            updated: Date.now(),
            versionNonce: Math.floor(Math.random() * 2000000000),
          };
        }
        return el;
      });

      api.updateScene({ elements: updatedElements });
      api.refresh();
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-10">
      <CardContent>
        <Textarea
          placeholder={hasSelection 
            ? "Describe what you want to create or modify..." 
            : "Select elements first..."
          }
          value={aiPrompt}
          onChange={(e) => setAIPrompt(e.target.value)}
          disabled={!hasSelection}
        />
        <Button 
          onClick={handleAIProcess}
          disabled={!hasSelection || !aiPrompt.trim()}
        >
          Generate with AI
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. State Management
- ✅ Use selective Zustand subscriptions
- ✅ Don't destructure entire store in components
- ✅ Use refs for values that don't need re-renders
- ✅ Keep store actions simple and focused

### 2. Persistence
- ✅ Debounce saves (3+ seconds for drawing apps)
- ✅ Use localStorage for immediate persistence
- ✅ Database saves for long-term storage (separate from UI)
- ✅ Don't interfere with Excalidraw's internal state

### 3. AI Integration
- ✅ Pass exact element IDs to AI
- ✅ Preserve all element properties when applying changes
- ✅ Handle both modifications and new elements
- ✅ Use clear, specific prompts to AI

### 4. Performance
- ✅ Import Excalidraw CSS
- ✅ Add custom styles for better integration
- ✅ Prevent unnecessary re-renders with selective subscriptions
- ✅ Use proper error boundaries

### 5. Error Handling
- ✅ Always provide collaborators as Map
- ✅ Validate element properties before applying changes
- ✅ Use try-catch for scene updates
- ✅ Provide fallbacks for failed operations

## Common Pitfalls to Avoid

### ❌ Don't Do This:
```typescript
// Causes infinite loops
const { api, markDirty } = useCanvasStore();
useEffect(() => {
  api?.onChange(() => markDirty());
}, [api, markDirty]);

// Causes re-render storms
const store = useCanvasStore(); // Subscribes to everything

// Breaks linear elements
const updated = { type: el.type, x: el.x }; // Missing required properties

// Wrong collaborators type
appState.collaborators = {}; // Should be Map
```

### ✅ Do This:
```typescript
// Prevents loops
const api = useCanvasStore(state => state.api);
useEffect(() => {
  api?.onChange(() => useCanvasStore.getState().markDirty());
}, [api]);

// Selective subscriptions
const api = useCanvasStore(state => state.api);
const elements = useCanvasStore(state => state.elements);

// Preserve all properties
const updated = { ...el, backgroundColor: newColor };

// Correct collaborators type
appState.collaborators = new Map();
```

## Summary

Excalidraw integration requires careful attention to:
1. **State Management**: Use selective subscriptions and refs
2. **CSS**: Always import Excalidraw styles
3. **Persistence**: Debounce saves and don't interfere with canvas state
4. **AI Integration**: Preserve element properties and use exact IDs
5. **Performance**: Prevent unnecessary re-renders and updates

Following these patterns will give you a smooth, performant Excalidraw integration with AI capabilities.

---

**Built with ❤️ during Wedbraw development - all pain points documented for future reference!**
