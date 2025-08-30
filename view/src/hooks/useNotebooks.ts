import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Save notebooks to localStorage with size protection
  const saveNotebooks = (notebooksToSave: Record<string, NotebookType>) => {
    console.log('[SAVE] Saving notebooks with cells:', Object.keys(notebooksToSave).map(id => ({
      id,
      cells: notebooksToSave[id].cells.length
    })));
    
    try {
      // Create a safe copy with truncated outputs for storage
      const safeNotebooks: Record<string, NotebookType> = {};
      const MAX_OUTPUT_SIZE = 5000; // Max characters per output for localStorage
      
      for (const [id, notebook] of Object.entries(notebooksToSave)) {
        safeNotebooks[id] = {
          ...notebook,
          cells: notebook.cells.map(cell => {
            // If cell has outputs, truncate them for storage
            if (cell.outputs && cell.outputs.length > 0) {
              const safeOutputs = cell.outputs.map(output => {
                // Handle undefined or null content
                if (output.content === undefined || output.content === null) {
                  return output;
                }
                
                const content = typeof output.content === 'string' 
                  ? output.content 
                  : JSON.stringify(output.content);
                
                if (content && content.length > MAX_OUTPUT_SIZE) {
                  console.warn(`[SAVE] Truncating large output in cell ${cell.id} (${content.length} chars -> ${MAX_OUTPUT_SIZE} chars)`);
                  return {
                    ...output,
                    content: content.substring(0, MAX_OUTPUT_SIZE) + '\n...[Output truncated for storage]'
                  };
                }
                return output;
              });
              
              return { ...cell, outputs: safeOutputs };
            }
            return cell;
          })
        };
      }
      
      const serialized = JSON.stringify(safeNotebooks);
      
      // Check size before saving (localStorage typically has ~5-10MB limit)
      const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
      if (sizeInMB > 4) {
        console.error(`[SAVE] Notebook data too large (${sizeInMB.toFixed(2)}MB), further truncation needed`);
        // Could implement more aggressive truncation here if needed
      }
      
      localStorage.setItem('notebooks', serialized);
      console.log(`[SAVE] Successfully saved ${sizeInMB.toFixed(2)}MB to localStorage`);
    } catch (error) {
      console.error('Failed to save notebooks:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded! Large outputs have been truncated. The full data remains in memory for this session.');
      }
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
      setCurrentNotebookId(defaultNotebook.id);
      saveNotebooks(initialNotebooks);
      updateUrl(defaultNotebook.id);
    } else {
      console.log('[INIT] Using loaded notebooks');
      setNotebooks(loadedNotebooks);
      
      // Set current notebook from URL or default
      const targetNotebookId = loadedNotebooks[urlNotebookId] ? urlNotebookId : 'default';
      console.log('[INIT] Setting current notebook to:', targetNotebookId);
      setCurrentNotebookId(targetNotebookId);
      updateUrl(targetNotebookId);
    }
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

  const createNewNotebook = useCallback(() => {
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

    // Use functional state update to ensure consistency
    setNotebooks(prevNotebooks => {
      const updatedNotebooks = {
        ...prevNotebooks,
        [newNotebook.id]: newNotebook
      };
      saveNotebooks(updatedNotebooks);
      return updatedNotebooks;
    });
    
    setCurrentNotebookId(newNotebook.id);
    updateUrl(newNotebook.id);
  }, [notebooks]);

  const createNewNote = useCallback(() => {
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

    // Use functional state update to ensure consistency
    setNotebooks(prevNotebooks => {
      const updatedNotebooks = {
        ...prevNotebooks,
        [newNotebook.id]: newNotebook
      };
      saveNotebooks(updatedNotebooks);
      return updatedNotebooks;
    });
    
    setCurrentNotebookId(newNotebook.id);
    updateUrl(newNotebook.id);
  }, [notebooks]);

  const switchToNotebook = useCallback((notebookId: string) => {
    if (notebooks[notebookId] && notebookId !== currentNotebookId) {
      setCurrentNotebookId(notebookId);
      updateUrl(notebookId);
    }
  }, [notebooks, currentNotebookId]);

  const updateCurrentNotebook = useCallback((updatedNotebook: NotebookType) => {
    console.log('[UPDATE_NOTEBOOK] Called with', updatedNotebook.cells.length, 'cells');
    console.trace('Call stack');
    
    // Always accept the update - the caller knows what they're doing
    // This includes AI-generated cells, user edits, and deletions
    const merged = {
      ...updatedNotebook,
      updatedAt: new Date().toISOString(),
    };

    // Use functional state update to ensure consistency
    setNotebooks(prevNotebooks => {
      const nextNotebooks = {
        ...prevNotebooks,
        [merged.id]: merged,
      };
      saveNotebooks(nextNotebooks);
      return nextNotebooks;
    });
  }, []);

  const deleteNotebook = useCallback((notebookId: string) => {
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

    // Use functional state update to ensure consistency
    setNotebooks(prevNotebooks => {
      const updatedNotebooks = { ...prevNotebooks };
      delete updatedNotebooks[notebookId];
      saveNotebooks(updatedNotebooks);
      return updatedNotebooks;
    });

    // If deleting current notebook, switch to default
    if (notebookId === currentNotebookId) {
      setCurrentNotebookId('default');
      updateUrl('default');
    }
  }, [notebooks, currentNotebookId, updateCurrentNotebook]);

  // Use useMemo to ensure currentNotebook is properly computed when state changes
  const currentNotebook = useMemo(() => {
    return notebooks[currentNotebookId] || createDefaultNotebook();
  }, [notebooks, currentNotebookId]);
  
  const availableNotebooks = useMemo(() => Object.values(notebooks), [notebooks]);

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
