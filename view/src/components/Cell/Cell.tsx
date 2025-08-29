 
import { Play, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

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



  if (!view.selectedView) {
    return <div className="text-red-400 p-4">No compatible view found for cell type: {cell.type}</div>;
  }

  return (
    <div className="group relative" data-cell-id={cellIndex.toString().padStart(3, '0')}>
      {/* Drag Handle - appears on hover */}
      <div className="absolute -left-7 top-2.5 opacity-0 group-hover:opacity-50 transition-opacity">
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full ml-0.5"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full ml-0.5"></div>
        </div>
      </div>

      {/* Markdown Cell - Clean, minimal styling */}
      {cell.type === 'markdown' && (
        <div className="py-2 relative">
          {/* Controls for markdown - always visible for debugging */}
          <div className="absolute right-0 top-0 opacity-100 flex items-center gap-1 z-20 bg-background/80 backdrop-blur-sm rounded-md p-1">
            {view.selectedView.config?.canExecute && (
              <button
                onClick={(e) => {
                  console.log('RUN_BUTTON_CLICKED_MARKDOWN:', cellIndex);
                  e.preventDefault();
                  e.stopPropagation();
                  onRun();
                }}
                disabled={cell.status === 'running'}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:border-muted-foreground transition-colors"
                title="Run cell (Cmd+Enter)"
              >
                {cell.status === 'running' ? (
                  <div className="w-3 h-3 animate-spin">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  </div>
                ) : (
                  <Play size={12} />
                )}
                Run
              </button>
            )}
            <button
              onClick={(e) => {
                console.log('DELETE_BUTTON_CLICKED_MARKDOWN:', cellIndex);
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive border border-border rounded hover:border-destructive transition-colors"
              title="Delete cell"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {view.selectedView.config?.canEdit ? (
            <ViewWrapper
              cell={cell}
              selectedView={view.selectedView}
              onContentChange={content.handleContentChange}
              onViewDataChange={view.handleViewDataChange}
              onExecute={onRun}
            />
          ) : (
            <>
              {view.renderMode === 'edit' ? (
                <textarea
                  ref={textarea.textareaRef}
                  value={content.content}
                  onChange={(e) => content.handleContentChange(e.target.value)}
                  onKeyDown={keyboard.handleKeyDown}
                  placeholder="Type your ideas here..."
                  className="w-full resize-none border-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-base leading-relaxed"
                  style={{ minHeight: '1.5rem' }}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content.content}</ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Code Cell - Container with header and run button */}
      {cell.type !== 'markdown' && (
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          {/* Code Cell Header */}
          <div className="flex items-center justify-between h-10 px-2 py-1.5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-4 h-4 text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                /{new Date().getFullYear()}/{new Date().toLocaleDateString('en', {month: 'short'}).toLowerCase()}/{new Date().getDate()}/tools/{cell.type}_cell.{cell.type === 'javascript' ? 'ts' : cell.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {cell.status === 'success' && cell.executionTime && (
                <div className="flex items-center gap-1 px-1">
                  <span className="text-xs text-muted-foreground">
                    Executed at {new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="w-4 h-4 text-muted-foreground">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                </div>
              )}
              
              {view.selectedView.config?.canExecute && (
                <button
                  onClick={(e) => {
                    console.log('RUN_BUTTON_CLICKED_CODE:', cellIndex);
                    e.preventDefault();
                    e.stopPropagation();
                    onRun();
                  }}
                  disabled={cell.status === 'running'}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d0ec1a] text-[#07401a] rounded-lg text-sm font-normal hover:bg-[#c5e016] transition-colors disabled:opacity-50"
                >
                  <span>Run</span>
                  {cell.status === 'running' ? (
                    <div className="w-3.5 h-3.5 animate-spin">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                    </div>
                  )}
                </button>
              )}
              
              {/* Delete button for code cells */}
              <button
                onClick={(e) => {
                  console.log('DELETE_BUTTON_CLICKED_CODE:', cellIndex);
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive border border-border rounded hover:border-destructive transition-colors"
                title="Delete cell"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="bg-background rounded-xl m-1 relative">
            {view.selectedView.config?.canEdit ? (
              <ViewWrapper
                cell={cell}
                selectedView={view.selectedView}
                onContentChange={content.handleContentChange}
                onViewDataChange={view.handleViewDataChange}
                onExecute={onRun}
              />
            ) : (
              <div className="p-4">
                {cell.type === 'javascript' ? (
                  <CodeMirror
                    value={content.content}
                    onChange={(value) => content.handleContentChange(value)}
                    onKeyDown={keyboard.handleKeyDown}
                    extensions={[javascript()]}

                    placeholder="// Enter JavaScript code here..."
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
                      fontSize: '15px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  />
                ) : (
                  <textarea
                    ref={textarea.textareaRef}
                    value={content.content}
                    onChange={(e) => content.handleContentChange(e.target.value)}
                    onKeyDown={keyboard.handleKeyDown}
                    placeholder={`Enter ${cell.type} code here...`}
                    className="w-full resize-none border-none outline-none bg-transparent font-mono text-sm"
                  />
                )}
              </div>
            )}

            {/* Expand button - bottom right */}
            <button className="absolute bottom-2.5 right-2.5 w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <div className="w-4.5 h-4.5 text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,3 21,3 21,9"/>
                  <polyline points="9,21 3,21 3,15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Output Section */}
          {cell.outputs && cell.outputs.length > 0 && (
            <div className="p-2 space-y-2.5">
              <div className="bg-background rounded-xl p-4 relative">
                <div className="font-mono text-sm">
                  {cell.outputs.map((output, index) => (
                    <div key={index} className={output.type === 'error' ? 'text-destructive' : 'text-foreground'}>
                      {typeof output.content === 'string' 
                        ? output.content 
                        : JSON.stringify(output.content, null, 2)
                      }
                    </div>
                  ))}
                </div>
                
                {/* Output action buttons */}
                <div className="absolute bottom-2.5 right-2.5 flex gap-1">
                  <button className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                    <div className="w-4.5 h-4.5 text-muted-foreground">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,3 21,3 21,9"/>
                        <polyline points="9,21 3,21 3,15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                    </div>
                  </button>
                  <button className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                    <div className="w-4.5 h-4.5 text-muted-foreground">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Variable output if available */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-muted-foreground">Variable</span>
                <div className="bg-background px-2 py-1 rounded-xl">
                  <span className="font-mono text-sm text-violet-500">
                    ${cell.type}Response
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
