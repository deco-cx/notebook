import React, { useState, useRef, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Cell as CellType } from '../../types/notebook';

interface CellProps {
  cell: CellType;
  cellIndex: number;
  onContentChange: (content: string) => void;
  onRun: () => void;
  onTypeChange: (type: 'markdown' | 'javascript') => void;
}

export function Cell({ cell, cellIndex, onContentChange, onRun, onTypeChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [renderMode, setRenderMode] = useState<'edit' | 'preview' | 'output'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onTypeChange('markdown');
    }
    // Ctrl+J for javascript
    if (e.ctrlKey && e.key === 'j') {
      e.preventDefault();
      onTypeChange('javascript');
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

  return (
    <div className="cell" data-cell-id={cellIndex.toString().padStart(3, '0')}>
      {/* Cell Header */}
      <div className="cell-header">
        <span className="cell-id">CELL_{cellIndex.toString().padStart(3, '0')}</span>
        <span className="cell-type">[{cell.type.toUpperCase()}]</span>
        <span className={`status-indicator ${getStatusColor()}`}></span>
        
        {/* Type switcher */}
        <select 
          value={cell.type} 
          onChange={(e) => onTypeChange(e.target.value as 'markdown' | 'javascript')}
          className="bg-transparent text-xs border border-gray-600 px-2 py-1 text-white"
        >
          <option value="markdown">MARKDOWN</option>
          <option value="javascript">JAVASCRIPT</option>
        </select>

        {/* Render mode switcher */}
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

        <span className="exec-time">EXEC: {formatExecutionTime(cell.executionTime)}</span>
        
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
      </div>

      {/* Cell Content */}
      <div className="cell-content">
        {renderMode === 'edit' && (
          <textarea
            ref={textareaRef}
            value={cell.content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              cell.type === 'markdown' 
                ? '# Enter markdown here...\n\nDescribe what you want to do and run this cell to generate code.'
                : '// Enter JavaScript code here...\n\nconst result = await env.DATABASES.RUN_SQL({\n  sql: "SELECT * FROM users LIMIT 10"\n});\nconsole.log(result);'
            }
            className="cell-editor"
          />
        )}

        {renderMode === 'preview' && cell.type === 'markdown' && (
          <div className="markdown-preview">
            <ReactMarkdown>{cell.content}</ReactMarkdown>
          </div>
        )}

        {renderMode === 'output' && cell.outputs && cell.outputs.length > 0 && (
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
