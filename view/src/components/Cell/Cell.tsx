import React from 'react';
import { Play, Square, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Cell as CellInterface } from '../../types/notebook';
import { ViewWrapper } from './ViewWrapper';
import { 
  useCellView, 
  useCellContent, 
  useCellKeyboard, 
  useCellTextarea 
} from '../../hooks';

interface CellProps {
  cell: CellInterface;
  cellIndex: number;
  onUpdate: (cell: CellInterface) => void;
  onRun: () => void;
  onDelete: () => void;
}

export function Cell({ cell, cellIndex, onUpdate, onRun, onDelete }: CellProps) {
  // Use extracted hooks
  const view = useCellView(cell, onUpdate);
  const content = useCellContent(cell, onUpdate);
  const keyboard = useCellKeyboard(onRun, content.handleTypeChange);
  const textarea = useCellTextarea(cell.content);

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

  if (!view.selectedView) {
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
        <span className="ml-1 text-xs font-mono text-gray-200">{view.selectedView.name}</span>
        <span className={`status-indicator ${getStatusColor()}`}></span>
        {cell.omitOutputToAi && (
          <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-yellow-700 text-yellow-200">
            AI OUTPUT OMITTED
          </span>
        )}
        

        {/* View Selector */}
        {view.compatibleViews.length > 0 && (
          <select
            value={view.selectedViewId}
            onChange={(e) => view.handleViewChange(e.target.value)}
            className="text-xs ml-2 cell-select"
          >
            {view.compatibleViews.map(viewOption => (
              <option key={viewOption.id} value={viewOption.id}>
                {viewOption.name}
              </option>
            ))}
          </select>
        )}

        {/* Legacy render mode switcher - keep for backward compatibility with old cells */}
        {!view.selectedView.config?.canEdit && (
          <div className="flex gap-1">
            <button
              onClick={() => view.setRenderMode('edit')}
              className={`px-2 py-1 text-xs ${view.renderMode === 'edit' ? 'bg-construction text-black' : 'text-gray-400'}`}
            >
              EDIT
            </button>
            {view.canPreview && (
              <button
                onClick={() => view.setRenderMode('preview')}
                className={`px-2 py-1 text-xs ${view.renderMode === 'preview' ? 'bg-construction text-black' : 'text-gray-400'}`}
              >
                PREVIEW
              </button>
            )}
            {view.hasOutputs && (
              <button
                onClick={() => view.setRenderMode('output')}
                className={`px-2 py-1 text-xs ${view.renderMode === 'output' ? 'bg-construction text-black' : 'text-gray-400'}`}
              >
                OUTPUT
              </button>
            )}
          </div>
        )}

        <span className="exec-time">EXEC: {formatExecutionTime(cell.executionTime || cell.metadata?.executionTime)}</span>
        
        {view.selectedView.config?.canExecute && (
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
        {view.selectedView.config?.canEdit ? (
          /* Use new view system */
          <ViewWrapper
            cell={cell}
            selectedView={view.selectedView}
            onContentChange={content.handleContentChange}
            onViewDataChange={view.handleViewDataChange}
            onExecute={onRun}
          />
        ) : (
          /* Fallback to legacy rendering for views that don't support editing */
          <>
            {view.renderMode === 'edit' && (
              <>
                {cell.type === 'javascript' ? (
                  <CodeMirror
                    value={content.content}
                    onChange={(value) => content.handleContentChange(value)}
                    onKeyDown={keyboard.handleKeyDown}
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
                    ref={textarea.textareaRef}
                    value={content.content}
                    onChange={(e) => content.handleContentChange(e.target.value)}
                    onKeyDown={keyboard.handleKeyDown}
                    placeholder="# Enter markdown here...

Describe what you want to do and run this cell to generate code."
                    className="cell-editor"
                  />
                )}
              </>
            )}

            {view.renderMode === 'preview' && cell.type === 'markdown' && (
              <div className="markdown-preview">
                <ReactMarkdown>{content.content}</ReactMarkdown>
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
