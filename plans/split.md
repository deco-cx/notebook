# Logic-UI Separation Plan: Extract Custom Hooks

## Overview

This plan separates business logic from UI components by extracting all logic into custom hooks. This approach creates clean APIs for components to access state and functions, making UI editing safer and more focused.

## Current State Analysis

### Components with Mixed Logic/UI:

1. **Notebook** - Complex cell management, execution logic, RPC calls
2. **Cell** - View management, keyboard shortcuts, content handling
3. **ExcalidrawView** - Data parsing, debounced saves, scene management
4. **TipTapView** - Editor state, content synchronization
5. **AppSidebar** - Navigation state, menu management
6. **Various UI components** - Form handling, validation, state management

### Existing Hooks (Good Foundation):

- `useNotebooks` - Already well-structured
- `useToolCalls` - Clean localStorage integration
- `use-mobile` - Simple responsive logic

## Refactoring Strategy

### Phase 1: Core Notebook Logic Extraction

#### 1.1 Create `useNotebookExecution` Hook

Extract all cell execution logic from `Notebook.tsx`:

```typescript
// view/src/hooks/useNotebookExecution.ts
export function useNotebookExecution(notebook: NotebookType) {
  return {
    // State
    isExecuting: boolean,
    apiCalls: number,

    // Actions
    runCell: (cellIndex: number) => Promise<void>,
    executeJavaScript: (code: string, environment: any) => Promise<any>,
    createExecutionEnvironment: (nb: NotebookType) => any,

    // Utilities
    formatExecutionTime: (time?: number) => string,
    getStatusColor: (status: string) => string,
  };
}
```

#### 1.2 Create `useNotebookCells` Hook

Extract cell CRUD operations from `Notebook.tsx`:

```typescript
// view/src/hooks/useNotebookCells.ts
export function useNotebookCells(notebook: NotebookType, onNotebookChange: (nb: NotebookType) => void) {
  return {
    // Actions
    addCell: (type?: CellType, content?: string) => void,
    updateCell: (cellIndex: number, updates: Partial<CellInterface>) => void,
    deleteCell: (cellIndex: number) => void,

    // Derived state
    cellCount: number,
    hasMultipleCells: boolean
  }
}
```

#### 1.3 Create `useNotebookPersistence` Hook

Extract save/load logic:

```typescript
// view/src/hooks/useNotebookPersistence.ts
export function useNotebookPersistence(notebook: NotebookType) {
  return {
    // State
    isSaving: boolean,
    lastSaved: Date | null,

    // Actions
    saveNotebook: () => void,
    autoSave: boolean,

    // Status
    hasUnsavedChanges: boolean
  }
}
```

### Phase 2: Cell Component Logic Extraction

#### 2.1 Create `useCellView` Hook

Extract view management from `Cell.tsx`:

```typescript
// view/src/hooks/useCellView.ts
export function useCellView(cell: CellInterface, onUpdate: (cell: CellInterface) => void) {
  return {
    // State
    selectedViewId: string,
    renderMode: 'edit' | 'preview' | 'output',
    compatibleViews: ViewDefinition[],
    selectedView: ViewDefinition | undefined,

    // Actions
    handleViewChange: (viewId: string) => void,
    setRenderMode: (mode: 'edit' | 'preview' | 'output') => void,

    // Derived
    canPreview: boolean,
    hasOutputs: boolean
  }
}
```

#### 2.2 Create `useCellContent` Hook

Extract content handling:

```typescript
// view/src/hooks/useCellContent.ts
export function useCellContent(cell: CellInterface, onUpdate: (cell: CellInterface) => void) {
  return {
    // Actions
    handleContentChange: (content: string) => void,
    handleViewDataChange: (viewData: Record<string, any>) => void,
    handleTypeChange: (type: CellType) => void,

    // State
    content: string,
    viewData: Record<string, any>,
    type: CellType
  }
}
```

#### 2.3 Create `useCellKeyboard` Hook

Extract keyboard shortcuts:

```typescript
// view/src/hooks/useCellKeyboard.ts
export function useCellKeyboard(onRun: () => void, onTypeChange: (type: CellType) => void) {
  return {
    handleKeyDown: (e: React.KeyboardEvent) => void,
    shortcuts: {
      run: 'Cmd/Ctrl + Enter',
      markdown: 'Ctrl + M',
      javascript: 'Ctrl + J'
    }
  }
}
```

#### 2.4 Create `useCellTextarea` Hook

Extract textarea auto-resize:

```typescript
// view/src/hooks/useCellTextarea.ts
export function useCellTextarea(content: string) {
  return {
    textareaRef: RefObject<HTMLTextAreaElement>,
    autoResize: () => void
  }
}
```

### Phase 3: View-Specific Logic Extraction

#### 3.1 Create `useExcalidrawData` Hook

Extract Excalidraw logic:

```typescript
// view/src/hooks/useExcalidrawData.ts
export function useExcalidrawData(cell: CellInterface, onContentChange: (content: string) => void) {
  return {
    // Refs
    excalidrawAPIRef: RefObject<any>,

    // State
    initialData: any,
    isUpdating: boolean,

    // Actions
    handleChange: (elements: readonly any[], appState: any) => void,
    updateScene: (data: any) => void,

    // Utils
    parseContent: (content: string) => any,
    serializeData: (elements: any[], appState: any) => string
  }
}
```

#### 3.2 Create `useTipTapEditor` Hook

Extract TipTap logic:

```typescript
// view/src/hooks/useTipTapEditor.ts
export function useTipTapEditor(cell: CellInterface, onContentChange: (content: string) => void) {
  return {
    // Editor instance
    editor: Editor | null,

    // State
    isEditable: boolean,
    wordCount: number,
    characterCount: number,

    // Actions
    toggleEditable: () => void,
    insertContent: (content: string) => void,
    focus: () => void,

    // Formatting
    toggleBold: () => void,
    toggleItalic: () => void,
    toggleCode: () => void
  }
}
```

### Phase 4: Navigation and Layout Logic

#### 4.1 Create `useNavigation` Hook

Extract navigation state:

```typescript
// view/src/hooks/useNavigation.ts
export function useNavigation() {
  return {
    // State
    currentRoute: string,
    navigationItems: NavigationItem[],

    // Actions
    navigate: (path: string) => void,
    isActive: (path: string) => boolean,

    // Menu state
    isMenuOpen: boolean,
    toggleMenu: () => void
  }
}
```

#### 4.2 Create `useSidebarState` Hook

Extract sidebar logic:

```typescript
// view/src/hooks/useSidebarState.ts
export function useSidebarState() {
  return {
    // State
    isOpen: boolean,
    isMobile: boolean,

    // Actions
    toggle: () => void,
    open: () => void,
    close: () => void,

    // Responsive
    openOnDesktop: () => void,
    closeOnMobile: () => void
  }
}
```

### Phase 5: Form and Interaction Logic

#### 5.1 Create `useFormState` Hook

Generic form handling:

```typescript
// view/src/hooks/useFormState.ts
export function useFormState<T>(initialValues: T, onSubmit: (values: T) => void) {
  return {
    // State
    values: T,
    errors: Record<keyof T, string>,
    isSubmitting: boolean,
    isDirty: boolean,

    // Actions
    setValue: (field: keyof T, value: any) => void,
    setError: (field: keyof T, error: string) => void,
    handleSubmit: (e: React.FormEvent) => void,
    reset: () => void,

    // Validation
    validate: () => boolean,
    validateField: (field: keyof T) => boolean
  }
}
```

#### 5.2 Create `useDebounce` Hook

Debounced operations:

```typescript
// view/src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number) {
  return {
    debouncedValue: T,
    isDebouncing: boolean,
  };
}
```

## Implementation Plan

### Step 1: Extract Core Notebook Hooks (Week 1)

1. Create `useNotebookExecution` - Move all RPC calls and execution logic
2. Create `useNotebookCells` - Move CRUD operations
3. Create `useNotebookPersistence` - Move save/load logic
4. Refactor `Notebook.tsx` to use these hooks

### Step 2: Extract Cell Logic (Week 1)

1. Create `useCellView`, `useCellContent`, `useCellKeyboard`, `useCellTextarea`
2. Refactor `Cell.tsx` to be purely presentational
3. Test all cell operations work correctly

### Step 3: Extract View Logic (Week 2)

1. Create `useExcalidrawData` and refactor `ExcalidrawView.tsx`
2. Create `useTipTapEditor` and refactor `TipTapView.tsx`
3. Create similar hooks for other view types

### Step 4: Extract Navigation Logic (Week 2)

1. Create `useNavigation` and `useSidebarState`
2. Refactor navigation components
3. Ensure responsive behavior works

### Step 5: Extract Form Logic (Week 3)

1. Create `useFormState` and `useDebounce`
2. Refactor any form components
3. Add validation logic to hooks

### Step 6: Testing and Optimization (Week 3)

1. Add unit tests for all hooks
2. Performance optimization
3. Documentation updates

## Benefits

### For Development:

- **Safer UI Changes**: Logic is isolated, reducing risk of breaking functionality
- **Reusable Logic**: Hooks can be shared across components
- **Better Testing**: Logic can be tested independently
- **Cleaner Components**: Components focus only on rendering

### For Maintenance:

- **Clear Separation**: Business logic vs presentation logic
- **Easier Debugging**: Logic is centralized and well-defined
- **Better API Design**: Hooks provide clean interfaces
- **Reduced Complexity**: Components become simpler

## File Structure After Refactoring

```
view/src/hooks/
├── index.ts                    # Export all hooks
├── core/                       # Core business logic
│   ├── useNotebookExecution.ts
│   ├── useNotebookCells.ts
│   ├── useNotebookPersistence.ts
│   └── useToolCalls.ts         # (existing)
├── components/                 # Component-specific logic
│   ├── useCellView.ts
│   ├── useCellContent.ts
│   ├── useCellKeyboard.ts
│   ├── useCellTextarea.ts
│   ├── useExcalidrawData.ts
│   └── useTipTapEditor.ts
├── navigation/                 # Navigation and routing
│   ├── useNavigation.ts
│   └── useSidebarState.ts
├── forms/                      # Form and interaction
│   ├── useFormState.ts
│   └── useDebounce.ts
└── utils/                      # Utility hooks
    ├── use-mobile.ts           # (existing)
    └── useLocalStorage.ts
```

## Component Transformation Example

### Before (Mixed Logic/UI):

```typescript
export function Cell({ cell, onUpdate, onRun, onDelete }) {
  const [selectedViewId, setSelectedViewId] = useState(/*...*/);
  const [renderMode, setRenderMode] = useState(/*...*/);
  const textareaRef = useRef(null);

  // 50+ lines of logic here
  const handleViewChange = (viewId) => {/*...*/};
  const handleContentChange = (content) => {/*...*/};
  const handleKeyDown = (e) => {/*...*/};
  // etc...

  return (
    <div>
      {/* 100+ lines of JSX */}
    </div>
  );
}
```

### After (Clean Separation):

```typescript
export function Cell({ cell, onUpdate, onRun, onDelete }) {
  const view = useCellView(cell, onUpdate);
  const content = useCellContent(cell, onUpdate);
  const keyboard = useCellKeyboard(onRun, content.handleTypeChange);
  const textarea = useCellTextarea(cell.content);

  return (
    <div>
      {/* Same JSX but using hook properties */}
      <textarea
        ref={textarea.textareaRef}
        value={content.content}
        onChange={(e) => content.handleContentChange(e.target.value)}
        onKeyDown={keyboard.handleKeyDown}
      />
      {/* etc... */}
    </div>
  );
}
```

## Success Criteria

1. **All components become primarily presentational**
2. **Business logic is centralized in hooks**
3. **No state management logic in JSX**
4. **Clean APIs for all component interactions**
5. **Improved testability and maintainability**
6. **No functionality regression**

This separation will make UI editing much safer and more focused, as requested by your dev friend. The logic will be forced into well-defined APIs, making the codebase more maintainable and less prone to breaking when making UI changes.
