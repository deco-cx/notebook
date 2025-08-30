# 5) Shortcuts: "/" (slash) and "@" mentions + Templates

**Objective:** Improve editing UX with quick commands and variable mentions, plus insert cells from templates (e.g. "Create Microsaas").

**Deliverables:**
- Slash command in TipTap displaying menu with actions (insert cell, insert template, etc.)
- "@" mentions for variables/notebook context
- Template insertion that creates multiple pre-configured cells

---

## Technical Steps:

### 1. TipTap Slash Command:
- Use `@tiptap/suggestion` to implement custom `SlashCommand`.
- Menu options: "Text", "HTML", "Insert Template: Create Microsaas", etc.
- Integrate in `view/src/hooks/components/useTipTapEditor.ts` by adding the extension.

### 2. "@" Mentions:
- Use `@tiptap/extension-mention` with `suggestion` and notebook variable data source.
- Inline rendering and variable token persistence.

### 3. Templates:
- Define template structure (TS file with definition) e.g. `view/src/utils/templates.ts`.
- Implement slash menu action that, when selecting template, inserts cell set in Notebook (use existing cell manipulation hooks).

---

## Implementation Details:

### 1. Slash Command Extension:
```typescript
// view/src/hooks/components/useTipTapEditor.ts (add to existing)
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

const SlashCommand = Extension.create({
  name: 'slashCommand',
  
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

// In useTipTapEditor hook:
const editor = useEditor({
  extensions: [
    // ... existing extensions
    SlashCommand.configure({
      suggestion: {
        items: ({ query }) => {
          return [
            {
              title: 'Add Code Cell',
              description: 'Insert a new code cell',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                onAddCell('javascript', '// New code cell');
              }
            },
            {
              title: 'Add Markdown Cell', 
              description: 'Insert a new text cell',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                onAddCell('markdown', '# New section');
              }
            },
            {
              title: 'Create Microsaas Template',
              description: 'Insert Microsaas template cells',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                insertTemplate('microsaas');
              }
            }
          ].filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          // Custom menu rendering
        }
      }
    })
  ]
});
```

### 2. Mention Extension:
```typescript
// Add to useTipTapEditor extensions:
import { Mention } from '@tiptap/extension-mention';

Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    items: ({ query }) => {
      // Get variables from notebook context
      const variables = extractVariablesFromNotebook(notebook);
      return variables.filter(variable =>
        variable.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    render: () => {
      // Custom mention rendering
    }
  }
})
```

### 3. Template System:
```typescript
// view/src/utils/templates.ts (new file)
export interface Template {
  id: string;
  name: string;
  description: string;
  cells: Array<{
    type: string;
    content: string;
    selectedView?: string;
  }>;
}

export const templates: Template[] = [
  {
    id: 'microsaas',
    name: 'Create Microsaas',
    description: 'Complete Microsaas development template',
    cells: [
      {
        type: 'markdown',
        content: `# Microsaas Development Plan

## 1. Market Research
- [ ] Identify target audience
- [ ] Analyze competitors
- [ ] Define unique value proposition

## 2. Technical Architecture
- [ ] Choose tech stack
- [ ] Design database schema
- [ ] Plan API endpoints

## 3. MVP Features
- [ ] Core functionality
- [ ] User authentication
- [ ] Payment integration`,
        selectedView: 'tiptap'
      },
      {
        type: 'javascript',
        content: `// Market research data collection
const marketResearch = {
  targetAudience: {
    demographics: '',
    painPoints: [],
    willingnessToPay: ''
  },
  competitors: [],
  uniqueValueProposition: ''
};

// TODO: Fill with actual research data
return marketResearch;`,
        selectedView: 'monaco'
      },
      {
        type: 'javascript',
        content: `// Database schema design
const databaseSchema = {
  users: {
    id: 'uuid',
    email: 'string',
    subscription: 'enum',
    createdAt: 'timestamp'
  },
  // Add more tables as needed
};

// TODO: Implement with Drizzle ORM
return databaseSchema;`,
        selectedView: 'monaco'
      },
      {
        type: 'html',
        content: `<div class="microsaas-dashboard">
  <h2>Microsaas Development Dashboard</h2>
  
  <div class="progress-section">
    <h3>Development Progress</h3>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 10%"></div>
    </div>
    <p>10% Complete</p>
  </div>
  
  <div class="metrics">
    <div class="metric">
      <h4>Users</h4>
      <span id="user-count">0</span>
    </div>
    <div class="metric">
      <h4>Revenue</h4>
      <span id="revenue">$0</span>
    </div>
  </div>
</div>

<style>
.microsaas-dashboard { padding: 20px; font-family: system-ui; }
.progress-bar { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #06b6d4); }
.metrics { display: flex; gap: 20px; margin-top: 20px; }
.metric { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
</style>`,
        selectedView: 'html'
      }
    ]
  }
];

export const insertTemplate = (templateId: string, onAddCells: Function) => {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  template.cells.forEach(cell => {
    onAddCells(cell.type, cell.content, cell.selectedView);
  });
};
```

### 4. Integration with Cell Actions:
```typescript
// view/src/hooks/components/useTipTapEditor.ts (update)
const insertTemplate = useCallback((templateId: string) => {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  // Use existing cell manipulation hooks
  template.cells.forEach((cell, index) => {
    setTimeout(() => {
      onAddCell(cell.type, cell.content, cell.selectedView);
    }, index * 100); // Stagger insertions
  });
}, [onAddCell]);
```

---

## File Changes:
- `view/src/hooks/components/useTipTapEditor.ts`
- `view/src/components/Notebook/Notebook.tsx` (if need handlers for inserting multiple cells)
- `view/src/utils/templates.ts` (new)
- `view/src/components/Cell/` (if new cell types are created)

## Packages:
- `@tiptap/suggestion`
- `@tiptap/extension-mention`

## Acceptance Criteria:
- Typing "/" opens menu with options and executes chosen action.
- Typing "@" lists available variables and inserts linked mention.
- Selecting "Create Microsaas" inserts expected cell set.

## Risks:
- Keymap conflicts; mitigate by isolating scopes and testing in different views.
