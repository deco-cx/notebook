import React, { useState } from 'react';
import { AppSidebar } from './components/app-sidebar';
import { SiteHeader } from './components/site-header';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
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
  console.log('CURRENT_NOTEBOOK_CELLS:', currentNotebook.cells.map(c => ({ id: c.id, type: c.type })));

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
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
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
