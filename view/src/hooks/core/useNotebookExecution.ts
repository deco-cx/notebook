import { useState } from 'react';
import { client } from '../../lib/rpc';
import { genId } from '../../lib/utils';
import type { Notebook as NotebookType, Cell as CellInterface } from '../../types/notebook';

export function useNotebookExecution(notebook: NotebookType) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiCalls, setApiCalls] = useState(0);

  const executeJavaScript = async (code: string) => {
    try {
      // Create execution environment with env global
      const env = createExecutionEnvironment(notebook);
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

  const createExecutionEnvironment = (nb: NotebookType) => {
    return {
      getCellOutput: (cellId: string) => {
        const cell = nb.cells.find(c => c.id === cellId);
        if (!cell?.outputs || cell.outputs.length === 0) return undefined;
        const rev = [...cell.outputs].reverse();
        const jsonOut = rev.find(o => o.type === 'json');
        if (jsonOut) {
          const val = jsonOut.content as any;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
          }
          return val;
        }
        const textOut = rev.find(o => o.type === 'text' || o.type === 'html');
        return textOut?.content as any;
      },
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

  const runCell = async (
    cellIndex: number, 
    updateCell: (index: number, updates: Partial<CellInterface>) => void,
    onNotebookChange: (notebook: NotebookType) => void
  ) => {
    const cell = notebook.cells[cellIndex];
    
    // Update cell status to running
    updateCell(cellIndex, { status: 'running' });
    setIsExecuting(true);
    
    const startTime = Date.now();

    try {
      if (cell.type === 'markdown') {
        // Run markdown cell through AI to generate new cells
        console.log('RUNNING_MARKDOWN_CELL:', cellIndex);
        
        const max = notebook.settings?.outputMaxSize ?? 6000;
        const result = await client.RUN_CELL({
          notebook: {
            cells: notebook.cells.map(c => ({
              id: c.id,
              type: c.type,
              content: c.content,
              omitOutputToAi: c.omitOutputToAi,
              outputs: c.omitOutputToAi ? undefined : (c.outputs?.map(o => {
                const serialized = typeof o.content === 'string' ? o.content : JSON.stringify(o.content ?? null);
                const safe = (serialized ?? '').slice(0, max);
                return { type: o.type, content: safe };
              }) ?? undefined)
            }))
          },
          cellToRun: cellIndex
        });

        console.log('RUN_CELL_RESULT:', result);

        if (result && result.cellsToAdd && result.cellsToAdd.length > 0) {
          console.log('ADDING_NEW_CELLS:', result.cellsToAdd);
          
          // Add the generated cells after the current cell
          const newCells = result.cellsToAdd.map((cellData: any) => ({
            id: genId(6),
            type: cellData.type,
            content: cellData.content,
            status: 'idle' as const
          }));

          const updatedCells = [
            ...notebook.cells.slice(0, cellIndex + 1),
            ...newCells,
            ...notebook.cells.slice(cellIndex + 1)
          ];

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

          // Use onNotebookChange with merged semantics in hook
          onNotebookChange({ ...notebook, cells: finalCells });
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
        
        const max = notebook.settings?.outputMaxSize ?? 6000;
        const outStr = result.success ? (JSON.stringify(result.output) ?? '') : String(result.error ?? '');
        const tooLarge = outStr.length > max;
        // Build a visual output block immediately under the cell
        const visualOutput = result.success ? `Return value: ${outStr}` : `Error: ${String(result.error ?? '')}`;
        
        updateCell(cellIndex, {
          status: result.success ? 'success' : 'error',
          executionTime: Date.now() - startTime,
          outputs: [
            {
              type: 'text',
              content: visualOutput,
            },
            {
              type: result.success ? 'json' : 'error',
              content: result.success ? result.output : result.error
            }
          ],
          omitOutputToAi: tooLarge ? true : undefined
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

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'status-running';
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      default: return 'status-idle';
    }
  };

  return {
    // State
    isExecuting,
    apiCalls,

    // Actions
    runCell,
    executeJavaScript,
    createExecutionEnvironment,

    // Utilities
    formatExecutionTime,
    getStatusColor,
  };
}
