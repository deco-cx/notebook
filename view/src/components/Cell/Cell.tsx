import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Cell as CellInterface, CellType } from '../../types/notebook';
import { ViewWrapper } from './ViewWrapper';
import { getCompatibleViews, getDefaultView } from '../../utils/availableViews';

interface CellProps {
  cell: CellInterface;
  cellIndex: number;
  onUpdate: (cell: CellInterface) => void;
  onRun: () => void;
  onDelete: () => void;
}

export function Cell({ cell, cellIndex, onUpdate, onRun, onDelete }: CellProps) {
  const [selectedViewId, setSelectedViewId] = useState(
    cell.selectedView || getDefaultView(cell.type)?.id
  );
  const [renderMode, setRenderMode] = useState<'edit' | 'preview' | 'output'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleTypeChange = (type: CellType) => {
    onUpdate({ 
      ...cell, 
      type,
      selectedView: getDefaultView(type)?.id 
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [cell.content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter or Ctrl+Enter to run
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
    // Ctrl+M for markdown
    if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      handleTypeChange('markdown');
    }
    // Ctrl+J for javascript
    if (e.ctrlKey && e.key === 'j') {
      e.preventDefault();
      handleTypeChange('javascript');
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const getStatusColor = () => {
    switch (cell.status) {
      case 'running': return 'status-running';
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      default: return 'status-idle';
    }
  };

  if (!selectedView) {
    return <div className="text-red-400 p-4">No compatible view found for cell type: {cell.type}</div>;
  }

  return (
    <div className="cell" data-cell-id={cellIndex.toString().padStart(3, '0')}>
      {/* Cell Header */}
      <div className="cell-header">
        <span className="cell-id">CELL_{cellIndex.toString().padStart(3, '0')}</span>
        <span className="ml-2 text-xs text-gray-400">ID:{cell.id}</span>
        <span className="cell-type">[{cell.type.toUpperCase()}]</span>
        <span className="ml-2 text-xs text-gray-400">VIEW:</span>
        <span className="ml-1 text-xs font-mono text-gray-200">{selectedView.name}</span>
        <span className={`status-indicator ${getStatusColor()}`}></span>
        {cell.omitOutputToAi && (
          <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-yellow-700 text-yellow-200">
            AI OUTPUT OMITTED
          </span>
        )}
        

        {/* View Selector */}
        {compatibleViews.length > 0 && (
          <select
            value={selectedViewId}
            onChange={(e) => handleViewChange(e.target.value)}
            className="bg-transparent text-xs border border-gray-600 px-2 py-1 text-white ml-2"
          >
            {compatibleViews.map(view => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        )}

        {/* Legacy render mode switcher - keep for backward compatibility with old cells */}
        {!selectedView.config?.canEdit && (
          <div className="flex gap-1">
            <button
              onClick={() => setRenderMode('edit')}
              className={`px-2 py-1 text-xs ${renderMode === 'edit' ? 'bg-construction text-black' : 'text-gray-400'}`}
            >
              EDIT
            </button>
            {cell.type === 'markdown' && (
              <button
                onClick={() => setRenderMode('preview')}
                className={`px-2 py-1 text-xs ${renderMode === 'preview' ? 'bg-construction text-black' : 'text-gray-400'}`}
              >
                PREVIEW
              </button>
            )}
            {cell.outputs && cell.outputs.length > 0 && (
              <button
                onClick={() => setRenderMode('output')}
                className={`px-2 py-1 text-xs ${renderMode === 'output' ? 'bg-construction text-black' : 'text-gray-400'}`}
              >
                OUTPUT
              </button>
            )}
          </div>
        )}

        <span className="exec-time">EXEC: {formatExecutionTime(cell.executionTime || cell.metadata?.executionTime)}</span>
        
        {selectedView.config?.canExecute && (
          <button
            onClick={onRun}
            disabled={cell.status === 'running'}
            className="run-button"
          >
            {cell.status === 'running' ? (
              <>
                <Square size={10} className="inline mr-1" />
                RUNNING
              </>
            ) : (
              <>
                <Play size={10} className="inline mr-1" />
                RUN
              </>
            )}
          </button>
        )}

        <button
          onClick={onDelete}
          className="delete-button"
          title="Delete cell"
        >
          <Trash2 size={10} className="inline mr-1" />
          DELETE
        </button>
      </div>

      {/* Cell Content */}
      <div className="cell-content">
        {selectedView.config?.canEdit ? (
          /* Use new view system */
          <ViewWrapper
            cell={cell}
            selectedView={selectedView}
            onContentChange={handleContentChange}
            onViewDataChange={handleViewDataChange}
            onExecute={onRun}
          />
        ) : (
          /* Fallback to legacy rendering for views that don't support editing */
          <>
            {renderMode === 'edit' && (
              <>
                {cell.type === 'javascript' ? (
                  <CodeMirror
                    value={cell.content}
                    onChange={(value) => handleContentChange(value)}
                    onKeyDown={handleKeyDown}
                    extensions={[javascript()]}
                    theme={oneDark}
                    placeholder="// Enter JavaScript code here...

const result = await env.DATABASES.RUN_SQL({
  sql: 'SELECT * FROM users LIMIT 10'
});
console.log(result);"
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: true,
                      highlightSelectionMatches: false,
                    }}
                    style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={cell.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="# Enter markdown here...

Describe what you want to do and run this cell to generate code."
                    className="cell-editor"
                  />
                )}
              </>
            )}

            {renderMode === 'preview' && cell.type === 'markdown' && (
              <div className="markdown-preview">
                <ReactMarkdown>{cell.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}

        {/* Always show outputs if available */}
        {cell.outputs && cell.outputs.length > 0 && (
          <div className="output-container">
            <div className="output-header">
              OUTPUT_BUFFER [{new Date().toLocaleTimeString()}]
            </div>
            {cell.outputs.map((output, index) => (
              <pre 
                key={index} 
                className={`output-content ${output.type === 'error' ? 'output-error' : ''}`}
              >
                {typeof output.content === 'string' 
                  ? output.content 
                  : JSON.stringify(output.content, null, 2)
                }
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
