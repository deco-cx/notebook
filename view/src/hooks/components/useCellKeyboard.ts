import React from 'react';
import type { CellType } from '../../types/notebook';

export function useCellKeyboard(
  onRun: () => void, 
  onTypeChange: (type: CellType) => void
) {
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

  return {
    handleKeyDown,
    shortcuts: {
      run: 'Cmd/Ctrl + Enter',
      markdown: 'Ctrl + M',
      javascript: 'Ctrl + J'
    }
  };
}
