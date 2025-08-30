import { useState } from 'react';
import type { Notebook as NotebookType } from '../../types/notebook';

export function useNotebookPersistence(notebook: NotebookType) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveNotebook = () => {
    // The notebook is automatically saved by the useNotebooks hook
    // This button provides manual save feedback to the user
    console.log('MANUAL_SAVE_TRIGGERED:', new Date().toLocaleTimeString());
    setLastSaved(new Date());
  };

  return {
    // State
    isSaving,
    lastSaved,

    // Actions
    saveNotebook,
    autoSave: true, // Always auto-save enabled

    // Status
    hasUnsavedChanges: false // Auto-save means no unsaved changes
  };
}
