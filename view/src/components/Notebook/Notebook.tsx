import { useState } from 'react';
import { Plus, Save, Cpu, Database, Zap, FileText, FolderOpen } from 'lucide-react';
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

export function Notebook({ notebook, onNotebookChange, onNewNotebook, onOpenNotebook }: NotebookProps) {
  const [memoryUsage] = useState('12.4MB');

  // Use extracted hooks
  const execution = useNotebookExecution(notebook);
  const cells = useNotebookCells(notebook, onNotebookChange);
  const persistence = useNotebookPersistence(notebook);

  // Cell operations are now handled by the cells hook
  const handleRunCell = (cellIndex: number) => {
    execution.runCell(cellIndex, cells.updateCell, onNotebookChange);
  };

  // All execution logic moved to useNotebookExecution hook

  return (
    <div className="notebook-container">
      {/* Top Navigation */}
      <div className="top-navigation">
        <div className="nav-section">
          <div className="nav-brand">
            <FileText size={16} />
            <span className="nav-title">BROWSER JUPYTER NOTEBOOK</span>
          </div>
        </div>
        
        <div className="nav-section">
          {onNewNotebook && (
            <button onClick={onNewNotebook} className="nav-button">
              <Plus size={12} className="inline mr-1" />
              NEW NOTEBOOK
            </button>
          )}
          {onOpenNotebook && (
            <button onClick={onOpenNotebook} className="nav-button">
              <FolderOpen size={12} className="inline mr-1" />
              OPEN
            </button>
          )}
          <button onClick={persistence.saveNotebook} className="nav-button">
            <Save size={12} className="inline mr-1" />
            SAVE
          </button>
        </div>
      </div>

      {/* Notebook Header */}
      <div className="notebook-header">
        <div className="notebook-title">
          NOTEBOOK_INSTANCE_001: {notebook.path}
        </div>
        <div className="notebook-status">
          <div className="toolbar-section">
            <Cpu size={12} />
            <span className="toolbar-label">EXEC_ENV:</span>
            <span className="toolbar-value">READY</span>
          </div>
          <div className="toolbar-section">
            <Database size={12} />
            <span className="toolbar-label">API_CALLS:</span>
            <span className="toolbar-value">{execution.apiCalls}/100</span>
          </div>
          <div className="toolbar-section">
            <Zap size={12} />
            <span className="toolbar-label">MEM:</span>
            <span className="toolbar-value">{memoryUsage}</span>
          </div>
          <button onClick={persistence.saveNotebook} className="run-button">
            <Save size={10} className="inline mr-1" />
            SAVE
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
          <span className="toolbar-label">TOOL_REGISTRY:</span>
          <span className="toolbar-value">LOADED</span>
        </div>
        <div className="toolbar-section">
          <span className="toolbar-label">CELLS:</span>
          <span className="toolbar-value">{cells.cellCount}</span>
        </div>
        <div className="toolbar-section">
          <span className="toolbar-label">STATUS:</span>
          <span className={`toolbar-value ${execution.isExecuting ? 'text-warning' : 'text-success'}`}>
            {execution.isExecuting ? 'EXECUTING' : 'IDLE'}
          </span>
        </div>
      </div>

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
    <div className="add-cell-menu flex flex-wrap gap-2 p-4 bg-gray-800 rounded-lg mb-4">
      {cellTypes.map(({ type, label, example }) => (
        <button
          key={type}
          onClick={() => onAddCell({ type, content: example })}
          className="px-3 py-2 bg-orange-500 text-black rounded font-mono text-xs hover:bg-orange-600 transition-colors"
        >
          <Plus size={12} className="inline mr-1" />
          {label}
        </button>
      ))}
    </div>
  );
}
