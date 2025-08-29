import React, { useState } from 'react';
import { Notebook } from './components/Notebook/Notebook';
import { NotebookSelector } from './components/NotebookSelector/NotebookSelector';
import { useNotebooks } from './hooks/useNotebooks';

export function App() {
  const [isNotebookSelectorOpen, setIsNotebookSelectorOpen] = useState(false);
  
  const {
    currentNotebook,
    availableNotebooks,
    createNewNotebook,
    switchToNotebook,
    updateCurrentNotebook,
    deleteNotebook
  } = useNotebooks();

  const handleOpenNotebook = () => {
    setIsNotebookSelectorOpen(true);
  };

  console.log('APP_RENDER: notebook has', currentNotebook.cells.length, 'cells');

  return (
    <>
      <Notebook 
        notebook={currentNotebook} 
        onNotebookChange={updateCurrentNotebook}
        onNewNotebook={createNewNotebook}
        onOpenNotebook={handleOpenNotebook}
      />
      
      <NotebookSelector
        isOpen={isNotebookSelectorOpen}
        onClose={() => setIsNotebookSelectorOpen(false)}
        notebooks={availableNotebooks}
        currentNotebookId={currentNotebook.id}
        onSelectNotebook={switchToNotebook}
        onDeleteNotebook={deleteNotebook}
      />
    </>
  );
}
