# Views System Architecture for Notebook Cells

## Overview

The views system provides a flexible, extensible architecture for rendering different types of content within notebook cells. Each cell type can have multiple view options (apps) that provide different ways to visualize and interact with the cell's content.

## Core Concept: Liquid View Selection

The system enables **liquid view selection** - users can seamlessly switch between different visualization modes for the same content, similar to how you might view a file in different applications on your desktop.

### Key Principles:
- **Content-View Separation**: Cell content is stored independently of how it's rendered
- **Multiple Views per Type**: Each cell type can have multiple compatible view options
- **App-Based Views**: Views are provided by installed workspace apps (same ecosystem as tools)
- **Fullscreen Capability**: All views can be expanded to fullscreen mode
- **Progressive Enhancement**: Start with component-based views, migrate to iframes later

## Data Structure Changes

### Enhanced Cell Interface

```typescript
// types/notebook.ts
interface Cell {
  id: string;
  type: CellType;
  content: string;
  selectedView?: string; // ID of the currently selected view app
  viewData?: Record<string, any>; // View-specific metadata/state
  outputs?: Array<{
    type: "json" | "text" | "html";
    content: string;
  }>;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    executionTime?: number;
  };
}

// Expanded cell types to support new views
type CellType = 
  | "markdown" 
  | "javascript" 
  | "python"
  | "html"
  | "json"
  | "excalidraw"
  | "workflow";
```

### View App Definition

```typescript
// types/views.ts
interface ViewApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportedTypes: CellType[];
  component?: React.ComponentType<ViewProps>; // For component-based views
  iframeUrl?: string; // For iframe-based views (future)
  config?: {
    fullscreenCapable: boolean;
    hasToolbar: boolean;
    canEdit: boolean;
    canExecute: boolean;
  };
}

interface ViewProps {
  cell: Cell;
  isFullscreen: boolean;
  onContentChange: (content: string) => void;
  onViewDataChange: (data: Record<string, any>) => void;
  onToggleFullscreen: () => void;
  onExecute?: () => void;
}
```

## Available Views Configuration

```typescript
// utils/availableViews.ts
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
      canExecute: false
    }
  },
  {
    id: "monaco",
    name: "Monaco Editor",
    description: "Advanced code editor with syntax highlighting",
    icon: "code",
    supportedTypes: ["javascript", "python", "json", "html"],
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
    view.supportedTypes.includes(cellType)
  );
}

export function getDefaultView(cellType: CellType): ViewApp | null {
  const compatible = getCompatibleViews(cellType);
  return compatible.length > 0 ? compatible[0] : null;
}
```

## View Components Architecture

### Base View Wrapper

```typescript
// components/Cell/ViewWrapper.tsx
interface ViewWrapperProps {
  cell: Cell;
  selectedView: ViewApp;
  onContentChange: (content: string) => void;
  onViewDataChange: (data: Record<string, any>) => void;
  onExecute?: () => void;
}

export function ViewWrapper({ 
  cell, 
  selectedView, 
  onContentChange, 
  onViewDataChange,
  onExecute 
}: ViewWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const ViewComponent = selectedView.component;

  if (!ViewComponent) {
    return <div>View component not found</div>;
  }

  return (
    <div 
      className={`view-wrapper relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fullscreen toggle button */}
      {(isHovered || isFullscreen) && selectedView.config.fullscreenCapable && (
        <button
          className="absolute top-2 right-2 z-10 p-2 bg-black/50 text-white rounded hover:bg-black/70"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      {/* View component */}
      <ViewComponent
        cell={cell}
        isFullscreen={isFullscreen}
        onContentChange={onContentChange}
        onViewDataChange={onViewDataChange}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onExecute={onExecute}
      />

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <div 
          className="absolute inset-0 bg-black/20 -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}
```

### Enhanced Cell Component

```typescript
// components/Cell/Cell.tsx
export function Cell({ cell, onUpdate, onRun, onDelete }: CellProps) {
  const [selectedViewId, setSelectedViewId] = useState(
    cell.selectedView || getDefaultView(cell.type)?.id
  );

  const compatibleViews = getCompatibleViews(cell.type);
  const selectedView = compatibleViews.find(v => v.id === selectedViewId);

  const handleViewChange = (viewId: string) => {
    setSelectedViewId(viewId);
    onUpdate({ 
      ...cell, 
      selectedView: viewId 
    });
  };

  const handleContentChange = (content: string) => {
    onUpdate({ ...cell, content });
  };

  const handleViewDataChange = (viewData: Record<string, any>) => {
    onUpdate({ 
      ...cell, 
      viewData: { ...cell.viewData, ...viewData }
    });
  };

  if (!selectedView) {
    return <div>No compatible view found for cell type: {cell.type}</div>;
  }

  return (
    <div className="cell border-2 border-orange-500 bg-gray-800 rounded-lg p-4 mb-4 relative">
      {/* Cell Header */}
      <div className="cell-header flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="cell-id text-orange-500 font-mono text-sm">
            CELL_{cell.id.slice(-3).toUpperCase()}
          </span>
          <span className="cell-type text-gray-300 font-mono text-sm">
            [{cell.type.toUpperCase()}]
          </span>
          
          {/* View Selector */}
          {compatibleViews.length > 1 && (
            <select
              value={selectedViewId}
              onChange={(e) => handleViewChange(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm font-mono"
            >
              {compatibleViews.map(view => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedView.config.canExecute && (
            <button
              onClick={onRun}
              className="bg-orange-500 text-black px-3 py-1 rounded font-mono text-sm font-bold hover:bg-orange-600"
            >
              ► RUN
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* View Content */}
      <ViewWrapper
        cell={cell}
        selectedView={selectedView}
        onContentChange={handleContentChange}
        onViewDataChange={handleViewDataChange}
        onExecute={onRun}
      />
    </div>
  );
}
```

## Individual View Implementations

### 1. TipTap View (Markdown)

```typescript
// components/Views/TipTapView.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

export function TipTapView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown
    ],
    content: cell.content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown()
      onContentChange(markdown)
    },
  })

  return (
    <div className={`tiptap-view ${isFullscreen ? 'h-screen p-8' : 'min-h-[200px]'}`}>
      {/* Toolbar */}
      <div className="tiptap-toolbar flex gap-2 mb-4 p-2 bg-gray-700 rounded">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor?.isActive('bold') ? 'bg-orange-500 text-black' : 'text-gray-300'
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor?.isActive('italic') ? 'bg-orange-500 text-black' : 'text-gray-300'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor?.isActive('heading', { level: 1 }) ? 'bg-orange-500 text-black' : 'text-gray-300'
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor?.isActive('bulletList') ? 'bg-orange-500 text-black' : 'text-gray-300'
          }`}
        >
          List
        </button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor}
        className="tiptap-content prose prose-invert max-w-none"
      />
    </div>
  )
}
```

### 2. Monaco View (Code)

```typescript
// components/Views/MonacoView.tsx
import Editor from '@monaco-editor/react'

export function MonacoView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const getLanguage = (cellType: CellType) => {
    switch (cellType) {
      case 'javascript': return 'javascript'
      case 'python': return 'python'
      case 'html': return 'html'
      case 'json': return 'json'
      default: return 'plaintext'
    }
  }

  return (
    <div className={`monaco-view ${isFullscreen ? 'h-screen' : 'h-64'}`}>
      <Editor
        height="100%"
        language={getLanguage(cell.type)}
        value={cell.content}
        onChange={(value) => onContentChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: isFullscreen },
          fontSize: 14,
          fontFamily: 'Fira Code, JetBrains Mono, monospace',
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  )
}
```

### 3. Excalidraw View

```typescript
// components/Views/ExcalidrawView.tsx
import { Excalidraw } from '@excalidraw/excalidraw'

export function ExcalidrawView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const handleChange = (elements: any[], appState: any) => {
    const data = {
      elements,
      appState: {
        ...appState,
        collaborators: new Map(), // Clean up for serialization
      }
    }
    onContentChange(JSON.stringify(data, null, 2))
  }

  const initialData = (() => {
    try {
      return cell.content ? JSON.parse(cell.content) : { elements: [], appState: {} }
    } catch {
      return { elements: [], appState: {} }
    }
  })()

  return (
    <div className={`excalidraw-view ${isFullscreen ? 'h-screen' : 'h-96'}`}>
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  )
}
```

### 4. Workflow View (React Flow) - TO BE DETAILED LATER

```typescript
// components/Views/WorkflowView.tsx
// TODO: Implement workflow designer with React Flow
// Should include:
// - Drag and drop nodes similar to Zapier
// - Connection system for workflow steps  
// - Node types for different actions
// - Visual workflow execution
// - Integration with available tools as workflow steps

export function WorkflowView({ cell, onContentChange, isFullscreen }: ViewProps) {
  // Placeholder implementation - to be expanded
  return (
    <div className={`workflow-view bg-gray-900 ${isFullscreen ? 'h-screen' : 'h-96'}`}>
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Workflow Designer - Implementation Pending</p>
      </div>
    </div>
  )
}
```

### 5. IFrame View (HTML)

```typescript
// components/Views/IframeView.tsx
export function IframeView({ cell, isFullscreen }: ViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(cell.content)
        doc.close()
      }
    }
  }, [cell.content])

  return (
    <div className={`iframe-view ${isFullscreen ? 'h-screen' : 'h-64'}`}>
      <iframe
        ref={iframeRef}
        className="w-full h-full border border-gray-600 rounded"
        sandbox="allow-scripts allow-same-origin"
        title="HTML Preview"
      />
    </div>
  )
}
```

## Manual Cell Addition for Testing

### Enhanced Add Cell Interface

```typescript
// components/Notebook/AddCellMenu.tsx
export function AddCellMenu({ onAddCell }: { onAddCell: (cell: Partial<Cell>) => void }) {
  const cellTypes: { type: CellType; label: string; example: string }[] = [
    {
      type: 'markdown',
      label: 'Markdown (TipTap)',
      example: '# Hello World\n\nThis is a **markdown** cell with *rich text* editing.'
    },
    {
      type: 'javascript',
      label: 'JavaScript (Monaco)',
      example: '// JavaScript code\nconst result = await env.DATABASES.RUN_SQL({\n  sql: "SELECT * FROM users LIMIT 5"\n});\nconsole.log(result);'
    },
    {
      type: 'excalidraw',
      label: 'Drawing (Excalidraw)',
      example: '{"elements":[],"appState":{"gridSize":null,"viewBackgroundColor":"#ffffff"}}'
    },
    {
      type: 'workflow',
      label: 'Workflow (React Flow)',
      example: '{"nodes":[{"id":"1","type":"input","data":{"label":"Start"},"position":{"x":250,"y":25}}],"edges":[]}'
    },
    {
      type: 'html',
      label: 'HTML Preview',
      example: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello HTML!</h1>\n  <p>This renders in an iframe</p>\n</body>\n</html>'
    }
  ]

  return (
    <div className="add-cell-menu flex gap-2 p-4 bg-gray-800 rounded-lg">
      {cellTypes.map(({ type, label, example }) => (
        <button
          key={type}
          onClick={() => onAddCell({
            type,
            content: example,
            selectedView: getDefaultView(type)?.id
          })}
          className="px-4 py-2 bg-orange-500 text-black rounded font-mono text-sm hover:bg-orange-600"
        >
          + {label}
        </button>
      ))}
    </div>
  )
}
```

## AI Prompt Updates

### Enhanced Cell Generation Context

```typescript
// Update to server/main.ts RUN_CELL tool prompt
const prompt = `Seu trabalho é analisar blocos de uma cadeia de comandos.

Você deve decidir quais novos blocos devem ser adicionados na esteira a depender do pedido do usuário.

Os blocos atuais são: ${JSON.stringify(currentBlocks, null, 2)}

Você pode criar um bloco de diferentes tipos:
- markdown: { type: "markdown", content: string } - Para explicações, documentação, análise em markdown
- javascript: { type: "javascript", content: string } - Para código JavaScript executável
- python: { type: "python", content: string } - Para código Python executável
- html: { type: "html", content: string } - Para conteúdo HTML que será renderizado
- json: { type: "json", content: string } - Para dados estruturados JSON
- excalidraw: { type: "excalidraw", content: string } - Para desenhos e diagramas (JSON do Excalidraw)
- workflow: { type: "workflow", content: string } - Para workflows visuais (JSON do React Flow)

Cada tipo de bloco tem visualizadores específicos:
- markdown: Editor TipTap com formatação rica
- javascript/python: Editor Monaco com syntax highlighting
- html: Preview em iframe sandboxed
- json: Editor Monaco com validação JSON
- excalidraw: Editor de desenho colaborativo
- workflow: Designer visual de workflows

O código que você vai gerar rodará num ambiente onde há tools disponíveis para serem chamadas com env.APP_NAME.TOOL_NAME(params).

As tools disponíveis para chamar são: 
${JSON.stringify(availableTools, null, 2)}

IMPORTANTE: Use sempre a sintaxe env.APP_NAME.TOOL_NAME(params) para chamar as tools.

Analise o pedido do usuário no bloco ${cellToRun} e gere os blocos apropriados com o tipo mais adequado para cada conteúdo.`
```

## Package Dependencies

```json
// view/package.json additions
{
  "dependencies": {
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13", 
    "@tiptap/extension-markdown": "^2.1.13",
    "tiptap-markdown": "^0.8.2",
    "@monaco-editor/react": "^4.6.0",
    "@excalidraw/excalidraw": "^0.17.0",
    "reactflow": "^11.10.1",
    "lucide-react": "^0.294.0"
  }
}
```

## TODO List: Views System Implementation

### Phase 1: Core Infrastructure
- [ ] **Update Cell Interface**
  - [ ] Extend `Cell` type with `selectedView` and `viewData` fields
  - [ ] Add new `CellType` enum values (excalidraw, workflow, html, json, python)
  - [ ] Create `ViewApp` and `ViewProps` interfaces
  - [ ] Update existing cell creation logic

- [ ] **Create Views System Foundation**
  - [ ] Create `utils/availableViews.ts` with view definitions
  - [ ] Implement `getCompatibleViews()` and `getDefaultView()` functions
  - [ ] Create base `ViewWrapper` component with fullscreen functionality
  - [ ] Add hover-to-show fullscreen button logic

- [ ] **Update Cell Component**
  - [ ] Add view selector dropdown to cell header
  - [ ] Integrate `ViewWrapper` into existing `Cell` component
  - [ ] Handle view switching and state persistence
  - [ ] Update cell styling for new view system

### Phase 2: TipTap Integration (Markdown)
- [ ] **Install TipTap Dependencies**
  - [ ] Add TipTap packages to package.json
  - [ ] Install markdown extension and starter kit
  - [ ] Configure build system for TipTap

- [ ] **Implement TipTap View**
  - [ ] Create `TipTapView` component
  - [ ] Configure editor with markdown support
  - [ ] Build custom toolbar with formatting options
  - [ ] Handle content synchronization with cell state
  - [ ] Add fullscreen mode support
  - [ ] Style with industrial theme

- [ ] **Integration Testing**
  - [ ] Test markdown cell creation with TipTap
  - [ ] Verify content persistence and loading
  - [ ] Test fullscreen mode functionality
  - [ ] Ensure proper cleanup on cell deletion

### Phase 3: Monaco Editor (Code)
- [ ] **Install Monaco Dependencies**
  - [ ] Add Monaco React package
  - [ ] Configure webpack/vite for Monaco workers
  - [ ] Set up language support

- [ ] **Implement Monaco View**
  - [ ] Create `MonacoView` component
  - [ ] Add language detection based on cell type
  - [ ] Configure dark theme and industrial styling
  - [ ] Implement syntax highlighting for JS/Python/HTML/JSON
  - [ ] Add fullscreen mode with minimap
  - [ ] Handle content synchronization

- [ ] **Enhanced Code Features**
  - [ ] Add code execution integration
  - [ ] Implement error highlighting
  - [ ] Add auto-completion for available tools
  - [ ] Test with different programming languages

### Phase 4: Excalidraw Integration
- [ ] **Install Excalidraw Dependencies**
  - [ ] Add Excalidraw package
  - [ ] Configure for React integration
  - [ ] Set up dark theme

- [ ] **Implement Excalidraw View**
  - [ ] Create `ExcalidrawView` component
  - [ ] Handle JSON serialization/deserialization
  - [ ] Implement change tracking and persistence
  - [ ] Add fullscreen mode support
  - [ ] Configure dark theme to match app

- [ ] **Drawing Features**
  - [ ] Test drawing creation and editing
  - [ ] Verify JSON export/import functionality
  - [ ] Ensure proper cleanup and memory management
  - [ ] Add example drawing templates

### Phase 5: HTML Preview (IFrame)
- [ ] **Implement IFrame View**
  - [ ] Create `IframeView` component
  - [ ] Set up sandboxed iframe with proper security
  - [ ] Handle HTML content injection
  - [ ] Add fullscreen mode support

- [ ] **Security & Performance**
  - [ ] Configure iframe sandboxing attributes
  - [ ] Implement content security policies
  - [ ] Add error handling for invalid HTML
  - [ ] Test with various HTML content types

### Phase 6: Enhanced Cell Management
- [ ] **Update Add Cell Interface**
  - [ ] Create `AddCellMenu` with all cell types
  - [ ] Add example content for each cell type
  - [ ] Implement quick cell creation buttons
  - [ ] Add cell type icons and descriptions

- [ ] **Cell Type Management**
  - [ ] Update cell creation logic
  - [ ] Handle default view selection
  - [ ] Add cell type validation
  - [ ] Implement cell type conversion (if needed)

### Phase 7: AI Integration Updates
- [ ] **Update RUN_CELL Tool**
  - [ ] Expand AI prompt with new cell types
  - [ ] Add context about available views
  - [ ] Update schema to include new cell types
  - [ ] Test AI generation for each cell type

- [ ] **Enhanced AI Context**
  - [ ] Provide examples for each cell type
  - [ ] Add view-specific generation hints
  - [ ] Improve tool integration documentation
  - [ ] Test AI generation quality

### Phase 8: Workflow Designer (Future)
- [ ] **Design Workflow System**
  - [ ] Define workflow node types
  - [ ] Design connection system
  - [ ] Plan integration with available tools
  - [ ] Create workflow execution engine

- [ ] **Implement Workflow View** (Placeholder for now)
  - [ ] Install React Flow dependencies
  - [ ] Create basic workflow canvas
  - [ ] Implement drag-and-drop functionality
  - [ ] Add node library with tool integrations
  - [ ] Build workflow execution system

### Phase 9: Polish & Optimization
- [ ] **Performance Optimization**
  - [ ] Implement lazy loading for heavy components
  - [ ] Optimize re-renders and memory usage
  - [ ] Add loading states and error boundaries
  - [ ] Test with large notebooks

- [ ] **User Experience**
  - [ ] Add keyboard shortcuts for view switching
  - [ ] Implement view preferences persistence
  - [ ] Add tooltips and help text
  - [ ] Improve mobile responsiveness

- [ ] **Testing & Documentation**
  - [ ] Write unit tests for view components
  - [ ] Create integration tests for view switching
  - [ ] Document view system architecture
  - [ ] Create user guides for each view type

### Phase 10: Future Enhancements
- [ ] **App Marketplace Integration**
  - [ ] Dynamic view discovery from workspace apps
  - [ ] App installation and configuration UI
  - [ ] View capability negotiation

- [ ] **IFrame-Based Views**
  - [ ] Secure sandboxing for third-party views
  - [ ] Message passing API for iframe communication
  - [ ] Performance optimization for iframe loading

- [ ] **Collaborative Features**
  - [ ] Real-time collaborative editing in TipTap
  - [ ] Shared Excalidraw sessions
  - [ ] Workflow collaboration

## Success Metrics

### Core Functionality
- [ ] Can switch between different views for the same cell content
- [ ] All view components render correctly in normal and fullscreen modes
- [ ] Content persistence works across view switches
- [ ] Manual cell creation works for all cell types

### View-Specific Features
- [ ] TipTap provides rich markdown editing with toolbar
- [ ] Monaco editor shows syntax highlighting for all supported languages
- [ ] Excalidraw allows drawing creation and editing
- [ ] IFrame view safely renders HTML content
- [ ] All views support the industrial design theme

### Integration Quality
- [ ] View switching is smooth and responsive
- [ ] AI generation works with new cell types
- [ ] Fullscreen mode works consistently
- [ ] No memory leaks or performance issues

This architecture provides a solid foundation for the extensible view system while maintaining the industrial aesthetic and functional focus of the notebook application. The liquid view selection enables users to choose the best visualization for their content while keeping the system open for future app integrations.
