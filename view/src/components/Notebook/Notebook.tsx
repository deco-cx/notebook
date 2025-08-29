import { useState } from 'react';
import { Plus, Save, Cpu, Database, Zap, FileText, FolderOpen } from 'lucide-react';
import { Cell } from '../Cell/Cell';
import type { Notebook as NotebookType, Cell as CellType, CellType as CellTypeEnum } from '../../types/notebook';
import { client } from '../../lib/rpc';
import { getDefaultView } from '../../utils/availableViews';

interface NotebookProps {
  notebook: NotebookType;
  onNotebookChange: (notebook: NotebookType) => void;
  onNewNotebook?: () => void;
  onOpenNotebook?: () => void;
}

export function Notebook({ notebook, onNotebookChange, onNewNotebook, onOpenNotebook }: NotebookProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiCalls, setApiCalls] = useState(0);
  const [memoryUsage] = useState('12.4MB');

  const saveNotebook = () => {
    // The notebook is automatically saved by the useNotebooks hook
    // This button provides manual save feedback to the user
    console.log('MANUAL_SAVE_TRIGGERED:', new Date().toLocaleTimeString());
  };

  const addCell = (type: CellTypeEnum = 'markdown', content: string = '') => {
    const newCell: CellType = {
      id: `cell_${Date.now()}`,
      type,
      content,
      status: 'idle',
      selectedView: getDefaultView(type)?.id,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const updatedNotebook = {
      ...notebook,
      cells: [...notebook.cells, newCell],
      updatedAt: new Date().toISOString()
    };

    onNotebookChange(updatedNotebook);
  };

  const updateCell = (cellIndex: number, updates: Partial<CellType>) => {
    const updatedCells = notebook.cells.map((cell, index) => 
      index === cellIndex ? { ...cell, ...updates } : cell
    );

    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteCell = (cellIndex: number) => {
    if (notebook.cells.length <= 1) {
      // Don't delete the last cell, just clear its content
      updateCell(cellIndex, { content: '', outputs: [], status: 'idle' });
      return;
    }

    const updatedCells = notebook.cells.filter((_, index) => index !== cellIndex);
    
    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  const runCell = async (cellIndex: number) => {
    const cell = notebook.cells[cellIndex];
    
    // Update cell status to running
    updateCell(cellIndex, { status: 'running' });
    setIsExecuting(true);
    
    const startTime = Date.now();

    try {
      if (cell.type === 'markdown') {
        // Run markdown cell through AI to generate new cells
        console.log('RUNNING_MARKDOWN_CELL:', cellIndex);
        
        const result = await client.RUN_CELL({
          notebook: {
            cells: notebook.cells.map(c => ({
              type: c.type,
              content: c.content
            }))
          },
          cellToRun: cellIndex
        });

        console.log('RUN_CELL_RESULT:', result);
        console.log('RUN_CELL_RESULT_TYPE:', typeof result);
        console.log('RUN_CELL_RESULT_KEYS:', Object.keys(result || {}));
        console.log('HAS_CELLS_TO_ADD:', !!(result && result.cellsToAdd));
        console.log('CELLS_TO_ADD_LENGTH:', result?.cellsToAdd?.length);

        if (result && result.cellsToAdd && result.cellsToAdd.length > 0) {
          console.log('ADDING_NEW_CELLS:', result.cellsToAdd);
          
          // Add the generated cells after the current cell
          const newCells = result.cellsToAdd.map((cellData: any) => ({
            id: `cell_${Date.now()}_${Math.random()}`,
            type: cellData.type,
            content: cellData.content,
            status: 'idle' as const
          }));

          console.log('NEW_CELLS_CREATED:', newCells);

          const updatedCells = [
            ...notebook.cells.slice(0, cellIndex + 1),
            ...newCells,
            ...notebook.cells.slice(cellIndex + 1)
          ];

          console.log('UPDATED_CELLS_ARRAY:', updatedCells);
          console.log('CALLING_onNotebookChange with', updatedCells.length, 'cells');

          // Update the current cell status in the updated cells array
          const finalCells = updatedCells.map((cell, index) => 
            index === cellIndex ? {
              ...cell,
              status: 'success' as const,
              executionTime: Date.now() - startTime,
              outputs: [{
                type: 'text' as const,
                content: `Generated ${newCells.length} new cell(s)`
              }]
            } : cell
          );

          onNotebookChange({
            ...notebook,
            cells: finalCells,
            updatedAt: new Date().toISOString()
          });
        } else {
          updateCell(cellIndex, {
            status: 'error',
            executionTime: Date.now() - startTime,
            outputs: [{
              type: 'text',
              content: 'No cells generated'
            }]
          });
        }
        
        setApiCalls(prev => prev + 1);
        
      } else if (cell.type === 'javascript') {
        // Execute JavaScript cell
        console.log('EXECUTING_JAVASCRIPT_CELL:', cellIndex);
        
        const result = await executeJavaScript(cell.content);
        
        updateCell(cellIndex, {
          status: result.success ? 'success' : 'error',
          executionTime: Date.now() - startTime,
          outputs: [{
            type: result.success ? 'json' : 'error',
            content: result.success ? result.output : result.error
          }]
        });
        
        if (result.apiCalls) {
          setApiCalls(prev => prev + result.apiCalls);
        }
      }
      
    } catch (error) {
      console.error('CELL_EXECUTION_ERROR:', error);
      updateCell(cellIndex, {
        status: 'error',
        executionTime: Date.now() - startTime,
        outputs: [{
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error'
        }]
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeJavaScript = async (code: string) => {
    try {
      // Create execution environment with env global
      const env = createExecutionEnvironment();
      let apiCallCount = 0;
      
      // Wrap env methods to count API calls
      const wrappedEnv = new Proxy(env, {
        get(target: any, prop) {
          if (typeof target[prop] === 'object' && target[prop] !== null) {
            return new Proxy(target[prop], {
              get(toolTarget: any, toolProp) {
                if (typeof toolTarget[toolProp] === 'function') {
                  return async (...args: any[]) => {
                    apiCallCount++;
                    return await toolTarget[toolProp](...args);
                  };
                }
                return toolTarget[toolProp];
              }
            });
          }
          return target[prop];
        }
      });

      // Create function with env in scope
      const func = new Function('env', `
        return (async () => {
          ${code}
        })();
      `);

      const result = await func(wrappedEnv);
      
      return {
        success: true,
        output: result,
        apiCalls: apiCallCount
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiCalls: 0
      };
    }
  };

  const createExecutionEnvironment = () => {
    return {
      DATABASES: {
        RUN_SQL: async (params: any) => {
          console.log('CALLING DATABASES.RUN_SQL:', params);
          try {
            // Call the tool through RPC client
            const result = await client.TOOL_CALL({
              toolName: 'DATABASES_RUN_SQL',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('DATABASES.RUN_SQL error:', error);
            return { error: 'Failed to execute SQL query' };
          }
        }
      },
      PROFILES: {
        GET: async (params: any) => {
          console.log('CALLING PROFILES.GET:', params);
          try {
            const result = await client.TOOL_CALL({
              toolName: 'PROFILES_GET',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('PROFILES.GET error:', error);
            return { error: 'Failed to get user profile' };
          }
        }
      },
      TEAMS: {
        LIST: async (params: any) => {
          console.log('CALLING TEAMS.LIST:', params);
          try {
            const result = await client.TOOL_CALL({
              toolName: 'TEAMS_LIST',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('TEAMS.LIST error:', error);
            return { error: 'Failed to list teams' };
          }
        },
        GET_THEME: async (params: any) => {
          console.log('CALLING TEAMS.GET_THEME:', params);
          try {
            const result = await client.TOOL_CALL({
              toolName: 'TEAMS_GET_THEME',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('TEAMS.GET_THEME error:', error);
            return { error: 'Failed to get theme' };
          }
        }
      },
      GITHUB_LUCIS: {
        GET_REPO: async (params: any) => {
          console.log('CALLING GITHUB_LUCIS.GET_REPO:', params);
          try {
            const result = await client.TOOL_CALL({
              toolName: 'GITHUB_LUCIS.GET_REPO',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('GITHUB_LUCIS.GET_REPO error:', error);
            return { error: 'Failed to get repository' };
          }
        },
        LIST_REPO_ISSUES: async (params: any) => {
          console.log('CALLING GITHUB_LUCIS.LIST_REPO_ISSUES:', params);
          try {
            const result = await client.TOOL_CALL({
              toolName: 'GITHUB_LUCIS.LIST_REPO_ISSUES',
              params
            });
            return result.result || result;
          } catch (error) {
            console.error('GITHUB_LUCIS.LIST_REPO_ISSUES error:', error);
            return { error: 'Failed to list repository issues' };
          }
        }
      }
    };
  };

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
          <button onClick={saveNotebook} className="nav-button">
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
            <span className="toolbar-value">{apiCalls}/100</span>
          </div>
          <div className="toolbar-section">
            <Zap size={12} />
            <span className="toolbar-label">MEM:</span>
            <span className="toolbar-value">{memoryUsage}</span>
          </div>
          <button onClick={saveNotebook} className="run-button">
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
          <span className="toolbar-value">{notebook.cells.length}</span>
        </div>
        <div className="toolbar-section">
          <span className="toolbar-label">STATUS:</span>
          <span className={`toolbar-value ${isExecuting ? 'text-warning' : 'text-success'}`}>
            {isExecuting ? 'EXECUTING' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Cells */}
      {notebook.cells.map((cell, index) => (
        <Cell
          key={cell.id}
          cell={cell}
          cellIndex={index}
          onUpdate={(updatedCell) => {
            const updatedCells = notebook.cells.map((c, i) => 
              i === index ? { 
                ...updatedCell, 
                metadata: { 
                  createdAt: updatedCell.metadata?.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  executionTime: updatedCell.metadata?.executionTime
                } 
              } : c
            );
            onNotebookChange({
              ...notebook,
              cells: updatedCells,
              updatedAt: new Date().toISOString()
            });
          }}
          onRun={() => runCell(index)}
          onDelete={() => deleteCell(index)}
        />
      ))}

      {/* Add Cell Menu */}
      <AddCellMenu onAddCell={(cellData) => addCell(cellData.type, cellData.content)} />
    </div>
  );
}

// Add Cell Menu Component for testing all cell types
function AddCellMenu({ onAddCell }: { onAddCell: (cell: { type: CellTypeEnum; content: string }) => void }) {
  const cellTypes: { type: CellTypeEnum; label: string; example: string }[] = [
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
