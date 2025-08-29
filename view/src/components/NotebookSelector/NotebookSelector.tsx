import React from 'react';
import { X, FileText, Trash2, Clock } from 'lucide-react';
import type { Notebook as NotebookType } from '../../types/notebook';

interface NotebookSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  notebooks: NotebookType[];
  currentNotebookId: string;
  onSelectNotebook: (notebookId: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
}

export function NotebookSelector({
  isOpen,
  onClose,
  notebooks,
  currentNotebookId,
  onSelectNotebook,
  onDeleteNotebook
}: NotebookSelectorProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getNotebookPreview = (notebook: NotebookType) => {
    const firstCell = notebook.cells[0];
    if (!firstCell) return 'Empty notebook';
    
    const content = firstCell.content;
    const preview = content.length > 100 
      ? content.substring(0, 100) + '...' 
      : content;
    
    return preview.replace(/\n/g, ' ').trim();
  };

  return (
    <div className="notebook-selector-overlay">
      <div className="notebook-selector-modal">
        {/* Header */}
        <div className="notebook-selector-header">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <span className="notebook-selector-title">SELECT NOTEBOOK</span>
          </div>
          <button onClick={onClose} className="notebook-selector-close">
            <X size={14} />
          </button>
        </div>

        {/* Notebook List */}
        <div className="notebook-selector-content">
          {notebooks.length === 0 ? (
            <div className="notebook-selector-empty">
              NO NOTEBOOKS FOUND
            </div>
          ) : (
            <div className="notebook-selector-list">
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className={`notebook-selector-item ${
                    notebook.id === currentNotebookId ? 'active' : ''
                  }`}
                  onClick={() => {
                    onSelectNotebook(notebook.id);
                    onClose();
                  }}
                >
                  <div className="notebook-selector-item-main">
                    <div className="notebook-selector-item-header">
                      <span className="notebook-selector-item-title">
                        {notebook.path.split('/').pop()?.replace('.json', '') || notebook.id}
                      </span>
                      <div className="notebook-selector-item-meta">
                        <span className="notebook-selector-cell-count">
                          {notebook.cells.length} CELL{notebook.cells.length !== 1 ? 'S' : ''}
                        </span>
                        {notebook.id === currentNotebookId && (
                          <span className="notebook-selector-current">CURRENT</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="notebook-selector-item-preview">
                      {getNotebookPreview(notebook)}
                    </div>
                    
                    <div className="notebook-selector-item-footer">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock size={10} />
                        <span>UPDATED: {formatDate(notebook.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {notebook.id !== 'default' && (
                    <button
                      className="notebook-selector-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete notebook "${notebook.path}"?`)) {
                          onDeleteNotebook(notebook.id);
                        }
                      }}
                      title="Delete notebook"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
