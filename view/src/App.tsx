import React, { useState, useEffect } from 'react';
import { Notebook } from './components/Notebook/Notebook';
import type { Notebook as NotebookType } from './types/notebook';

export function App() {
  const [notebook, setNotebook] = useState<NotebookType>(() => {
    // Try to load notebook from localStorage
    try {
      const saved = localStorage.getItem('notebook');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notebook from localStorage:', error);
    }

    // Default notebook
    return {
      id: 'notebook_001',
      path: '/2025/jan/27/index.json',
      cells: [
        {
          id: 'cell_welcome',
          type: 'markdown' as const,
          content: '# Welcome to Browser Jupyter Notebook\n\nThis is a proof-of-concept notebook that runs entirely in your browser and can call Deco workspace tools.\n\n**Try this:**\n1. Run this cell to generate some JavaScript code\n2. Edit the generated code and run it\n3. Add new cells using the buttons below',
          status: 'idle' as const
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const handleNotebookChange = (updatedNotebook: NotebookType) => {
    console.log('APP_NOTEBOOK_CHANGE:', updatedNotebook.cells.length, 'cells');
    console.log('APP_NOTEBOOK_CELLS:', updatedNotebook.cells.map(c => ({ id: c.id, type: c.type, content: c.content.substring(0, 50) + '...' })));
    setNotebook(updatedNotebook);
  };

  console.log('APP_RENDER: notebook has', notebook.cells.length, 'cells');

  return <Notebook notebook={notebook} onNotebookChange={handleNotebookChange} />;
}
