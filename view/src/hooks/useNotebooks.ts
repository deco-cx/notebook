import { useState, useEffect } from 'react';
import type { Notebook as NotebookType } from '../types/notebook';
import { genId } from '../lib/utils';

interface UseNotebooksReturn {
  currentNotebook: NotebookType;
  availableNotebooks: NotebookType[];
  createNewNotebook: () => void;
  createNewNote: () => void;
  switchToNotebook: (notebookId: string) => void;
  updateCurrentNotebook: (notebook: NotebookType) => void;
  deleteNotebook: (notebookId: string) => void;
}

export function useNotebooks(): UseNotebooksReturn {
  const [notebooks, setNotebooks] = useState<Record<string, NotebookType>>({});
  const [currentNotebookId, setCurrentNotebookId] = useState<string>('');

  // Get notebook ID from URL query parameter
  const getNotebookIdFromUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('notebook') || 'default';
  };

  // Update URL with notebook ID
  const updateUrl = (notebookId: string) => {
    const url = new URL(window.location.href);
    if (notebookId === 'default') {
      url.searchParams.delete('notebook');
    } else {
      url.searchParams.set('notebook', notebookId);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Load notebooks from localStorage (does not update state, just returns data)
  const loadNotebooks = () => {
    try {
      const stored = localStorage.getItem('notebooks');
      if (stored) {
        const parsedNotebooks = JSON.parse(stored);
        return parsedNotebooks;
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    }
    return {};
  };

  // Save notebooks to localStorage
  const saveNotebooks = (notebooksToSave: Record<string, NotebookType>) => {
    console.log('[SAVE] Saving notebooks with cells:', Object.keys(notebooksToSave).map(id => ({
      id,
      cells: notebooksToSave[id].cells.length
    })));
    try {
      localStorage.setItem('notebooks', JSON.stringify(notebooksToSave));
    } catch (error) {
      console.error('Failed to save notebooks:', error);
    }
  };

  // Create default notebook
  const createDefaultNotebook = (): NotebookType => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleDateString('en', { month: 'short' }).toLowerCase();
    const day = now.getDate();
    
    return {
      id: 'default',
      path: `/${year}/${month}/${day}/index.json`,
      cells: [
        {
          id: genId(6),
          type: 'markdown' as const,
          content: '# Welcome to Browser Jupyter Notebook\n\nThis is a proof-of-concept notebook that runs entirely in your browser and can call Deco workspace tools.\n\n**Try this:**\n1. Run this cell to generate some JavaScript code\n2. Edit the generated code and run it\n3. Add new cells using the buttons below',
          status: 'idle' as const
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { outputMaxSize: 6000 }
    };
  };

  // Initialize notebooks on mount
  useEffect(() => {
    console.log('[INIT] === INITIALIZING NOTEBOOKS ===');
    const urlNotebookId = getNotebookIdFromUrl();
    const loadedNotebooks = loadNotebooks();
    
    console.log('[INIT] Loaded from localStorage:', Object.keys(loadedNotebooks).map(id => ({
      id,
      cells: loadedNotebooks[id].cells.length
    })));
    
    // If no notebooks exist at all, create default
    if (Object.keys(loadedNotebooks).length === 0) {
      console.log('[INIT] No notebooks found, creating default');
      const defaultNotebook = createDefaultNotebook();
      const initialNotebooks = { [defaultNotebook.id]: defaultNotebook };
      setNotebooks(initialNotebooks);
      saveNotebooks(initialNotebooks);
    } else {
      console.log('[INIT] Using loaded notebooks');
      setNotebooks(loadedNotebooks);
    }

    // Set current notebook from URL or default
    const targetNotebookId = loadedNotebooks[urlNotebookId] ? urlNotebookId : 'default';
    console.log('[INIT] Setting current notebook to:', targetNotebookId);
    setCurrentNotebookId(targetNotebookId);
    updateUrl(targetNotebookId);
  }, []);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const urlNotebookId = getNotebookIdFromUrl();
      if (notebooks[urlNotebookId] && urlNotebookId !== currentNotebookId) {
        setCurrentNotebookId(urlNotebookId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [notebooks, currentNotebookId]);

  const createNewNotebook = () => {
    const newNotebook: NotebookType = {
      id: `notebook_${Date.now()}`,
      path: `/2025/jan/27/notebook_${Date.now()}.json`,
      cells: [
        {
          id: genId(6),
          type: 'markdown',
          content: '# New Notebook\n\nStart writing your notebook here...',
          status: 'idle'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { outputMaxSize: 6000 }
    };

    const updatedNotebooks = {
      ...notebooks,
      [newNotebook.id]: newNotebook
    };

    setNotebooks(updatedNotebooks);
    saveNotebooks(updatedNotebooks);
    setCurrentNotebookId(newNotebook.id);
    updateUrl(newNotebook.id);
  };

  const createNewNote = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleDateString('en', { month: 'short' }).toLowerCase();
    const day = now.getDate();

    const welcomeMarkdown = `# Welcome to deco\n\n**This is the first note in your workspace.**\n\nWrite your ideas in notes and deco will make them come true using AI software generation.\n\n---\n\nTips:\n- Add a new Markdown cell and describe what you want to build.\n- Press \\\"Run\\\" on the Markdown cell to let AI generate helpful code cells.\n- Edit and re-run code cells to iterate quickly.`;

    const jsWelcome = `// Welcome! Run this cell (click Run)\n// Then add a new Markdown cell ("+ Markdown"), write your idea,\n// and press Run on the Markdown cell to let AI generate code.\n\nalert('👋 Welcome to deco! Add a new Markdown cell, write your idea, and hit \"Run\" on that Markdown cell.');`;

    const newNotebook: NotebookType = {
      id: `note_${Date.now()}`,
      path: `/${year}/${month}/${day}/note_${Date.now()}.json`,
      cells: [
        {
          id: genId(6),
          type: 'markdown',
          content: welcomeMarkdown,
          status: 'idle'
        },
        {
          id: genId(6),
          type: 'javascript',
          content: jsWelcome,
          status: 'idle'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { outputMaxSize: 6000 }
    };

    const updatedNotebooks = {
      ...notebooks,
      [newNotebook.id]: newNotebook
    };

    setNotebooks(updatedNotebooks);
    saveNotebooks(updatedNotebooks);
    setCurrentNotebookId(newNotebook.id);
    updateUrl(newNotebook.id);
  };

  const switchToNotebook = (notebookId: string) => {
    if (notebooks[notebookId] && notebookId !== currentNotebookId) {
      setCurrentNotebookId(notebookId);
      updateUrl(notebookId);
    }
  };

  const updateCurrentNotebook = (updatedNotebook: NotebookType) => {
    console.log('[UPDATE_NOTEBOOK] Called with', updatedNotebook.cells.length, 'cells');
    console.trace('Call stack');
    
    // Always accept the update - the caller knows what they're doing
    // This includes AI-generated cells, user edits, and deletions
    const merged = {
      ...updatedNotebook,
      updatedAt: new Date().toISOString(),
    };

    const nextNotebooks = {
      ...notebooks,
      [merged.id]: merged,
    };
    
    // Update state with new notebooks
    setNotebooks(nextNotebooks);
    
    // Save to localStorage
    saveNotebooks(nextNotebooks);
  };

  const deleteNotebook = (notebookId: string) => {
    if (notebookId === 'default') {
      // Don't allow deleting the default notebook, just clear it
      // Clearing default notebook
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleDateString('en', { month: 'short' }).toLowerCase();
      const day = now.getDate();
      
      const resetNotebook: NotebookType = {
        id: 'default',
        path: `/${year}/${month}/${day}/index.json`,
        cells: [], // Empty cells array
        createdAt: notebooks['default']?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: { outputMaxSize: 6000 }
      };
      updateCurrentNotebook(resetNotebook);
      return;
    }

    const updatedNotebooks = { ...notebooks };
    delete updatedNotebooks[notebookId];

    // If deleting current notebook, switch to default
    if (notebookId === currentNotebookId) {
      setCurrentNotebookId('default');
      updateUrl('default');
    }

    setNotebooks(updatedNotebooks);
    saveNotebooks(updatedNotebooks);
  };

  const currentNotebook = notebooks[currentNotebookId] || createDefaultNotebook();
  const availableNotebooks = Object.values(notebooks);

  return {
    currentNotebook,
    availableNotebooks,
    createNewNotebook,
    createNewNote,
    switchToNotebook,
    updateCurrentNotebook,
    deleteNotebook
  };
}
