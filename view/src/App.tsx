import { useState } from 'react';
import { AppSidebar } from './components/app-sidebar';
import { SiteHeader } from './components/site-header';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { HomeInset } from './components/HomeInset';
import { useNotebooks } from './hooks/useNotebooks';

export function App() {
  const [isNotebookSelectorOpen, setIsNotebookSelectorOpen] = useState(false);
  
  const {
    currentNotebook,
    availableNotebooks,
    createNewNotebook,
    createNewNote,
    switchToNotebook,
    updateCurrentNotebook,
    deleteNotebook
  } = useNotebooks();

  const handleOpenNotebook = () => {
    setIsNotebookSelectorOpen(true);
  };

  // App component is ready with current notebook

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader onCreateNewNote={createNewNote} />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <HomeInset
              currentNotebook={currentNotebook}
              availableNotebooks={availableNotebooks}
              onNotebookChange={updateCurrentNotebook}
              onNewNotebook={createNewNotebook}
              onOpenNotebook={handleOpenNotebook}
              isNotebookSelectorOpen={isNotebookSelectorOpen}
              onCloseNotebookSelector={() => setIsNotebookSelectorOpen(false)}
              onSelectNotebook={switchToNotebook}
              onDeleteNotebook={deleteNotebook}
            />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
