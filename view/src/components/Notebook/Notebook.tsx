import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Cell as CellComponent } from '../Cell/Cell';
import type { Notebook as NotebookType, CellType } from '../../types/notebook';
import { 
  useNotebookExecution, 
  useNotebookCells, 
  useNotebookPersistence 
} from '../../hooks';

interface NotebookProps {
  notebook: NotebookType;
  onNotebookChange: (notebook: NotebookType) => void;
  onNewNotebook?: () => void;
  onOpenNotebook?: () => void;
}

export function Notebook({ notebook, onNotebookChange }: NotebookProps) {
  // Use extracted hooks
  const execution = useNotebookExecution(notebook);
  const cells = useNotebookCells(notebook, onNotebookChange);

  // Cell operations are now handled by the cells hook
  const handleRunCell = (cellIndex: number) => {
    execution.runCell(cellIndex, cells.updateCell, onNotebookChange);
  };

  // All execution logic moved to useNotebookExecution hook

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Date Header with Avatars - Notion style */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="text-sm font-normal text-muted-foreground uppercase tracking-wider">
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }).replace(',', 'TH,')}
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 border-2 border-purple-300 -mr-1.5 z-10" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 border-2 border-yellow-300" />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 max-w-2xl">
        {/* Cells */}
        {notebook.cells.map((cell, index) => (
          <CellComponent
            key={cell.id}
            cell={cell}
            cellIndex={index}
            onUpdate={(updatedCell) => cells.updateCellWithMetadata(index, updatedCell)}
            onRun={() => handleRunCell(index)}
            onDelete={() => cells.deleteCell(index)}
          />
        ))}

        {/* Add Cell Menu */}
        <AddCellMenu onAddCell={(cellData) => cells.addCell(cellData.type, cellData.content)} />
      </div>
    </div>
  );
}

// Add Cell Menu Component for testing all cell types
function AddCellMenu({ onAddCell }: { onAddCell: (cell: { type: CellType; content: string }) => void }) {
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
      type: 'python',
      label: 'Python (Monaco)',
      example: '# Python code\nprint("Hello from Python!")\nresult = {"message": "Python execution"}\nprint(result)'
    },
    {
      type: 'excalidraw',
      label: 'Drawing (Excalidraw)',
      example: JSON.stringify({
        elements: [
          {
            id: "welcome-text",
            type: "text",
            x: 100,
            y: 100,
            width: 300,
            height: 50,
            text: "Welcome to Excalidraw!\n✏️ Start drawing or select this text",
            fontSize: 20,
            fontFamily: 1,
            textAlign: "left",
            verticalAlign: "top",
            strokeColor: "#ff6b35",
            backgroundColor: "transparent",
            fillStyle: "solid",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            angle: 0,
            groupIds: [],
            frameId: null,
            roundness: null,
            seed: Math.floor(Math.random() * 1000000),
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
          }
        ],
        appState: {
          viewBackgroundColor: "#1a1a1a",
          gridSize: null
        }
      }, null, 2)
    },
    {
      type: 'workflow',
      label: 'Workflow (React Flow)',
      example: '{"nodes":[{"id":"1","type":"input","data":{"label":"Start"},"position":{"x":250,"y":25}}],"edges":[]}'
    },
    {
      type: 'html',
      label: 'HTML Preview',
      example: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    h1 {
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .card {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <h1>Hello HTML!</h1>
  <div class="card">
    <p>This is a fully rendered HTML preview with CSS styling!</p>
    <button onclick="alert('JavaScript works!')">Click me!</button>
  </div>
</body>
</html>`
    },
    {
      type: 'json',
      label: 'JSON Data',
      example: '{\n  "name": "Sample Data",\n  "type": "json",\n  "values": [1, 2, 3, 4, 5]\n}'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {cellTypes.map(({ type, label, example }) => (
        <button
          key={type}
          onClick={() => onAddCell({ type, content: example })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-muted-foreground transition-colors"
        >
          <Plus size={12} />
          {label}
        </button>
      ))}
    </div>
  );
}
