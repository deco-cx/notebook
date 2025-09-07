import React, { useState, useEffect } from 'react';
import { AppSidebar } from './components/app-sidebar';
import { SiteHeader } from './components/site-header';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { Notebook } from './components/Notebook/Notebook';
import { NotebookSelector } from './components/NotebookSelector/NotebookSelector';
import { AuthModal } from './components/auth/AuthModal';
import { useNotebooks } from './hooks/useNotebooks';
import { useAuth } from './hooks/useAuth';
import { useAuthModal } from './hooks/useAuthModal';
import { useSaveNotebook } from './hooks/useNotebookServer';
import { createOnboardingNotebook } from './utils/defaultNotebook';
import type { Notebook as NotebookType } from './types/notebook';

interface AppProps {
  initialNotebook?: any; // From server route
}

export function App({ initialNotebook }: AppProps = {}) {
  const [isNotebookSelectorOpen, setIsNotebookSelectorOpen] = useState(false);
  const { isLoggedIn, user, workspace } = useAuth();
  const { isOpen: isAuthModalOpen, feature: authFeature, requireAuth, closeModal } = useAuthModal();
  const saveNotebook = useSaveNotebook();
  
  const {
    currentNotebook,
    availableNotebooks,
    createNewNotebook,
    createNewNote,
    switchToNotebook,
    updateCurrentNotebook,
    deleteNotebook
  } = useNotebooks();

  // Show onboarding notebook for logged-out users
  const displayNotebook = React.useMemo(() => {
    if (!isLoggedIn && !initialNotebook) {
      return createOnboardingNotebook();
    }
    return initialNotebook || currentNotebook;
  }, [isLoggedIn, initialNotebook, currentNotebook]);

  const handleOpenNotebook = () => {
    setIsNotebookSelectorOpen(true);
  };

  const handleNotebookChange = (notebookId: string) => {
    if (isLoggedIn) {
      switchToNotebook(notebookId);
    }
  };

  const handleCreateNote = () => {
    if (requireAuth('creating new notes')) {
      createNewNote();
    }
  };

  const handleNotebookUpdate = (notebook: NotebookType) => {
    updateCurrentNotebook(notebook);
    
    // Save to server if logged in
    if (isLoggedIn && user) {
      saveNotebook.mutate({
        id: notebook.id,
        title: notebook.path || 'Untitled',
        cells: notebook.cells,
        tags: [],
        description: undefined
      });
    }
  };

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader 
          currentNotebook={displayNotebook ? { id: displayNotebook.id, title: displayNotebook.path || 'Untitled' } : null}
          onNotebookChange={handleNotebookChange}
          onCreateNote={handleCreateNote}
        />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Notebook 
                notebook={displayNotebook} 
                onNotebookChange={handleNotebookUpdate}
                onNewNotebook={createNewNotebook}
                onOpenNotebook={handleOpenNotebook}
              />
              
              <NotebookSelector
                isOpen={isNotebookSelectorOpen}
                onClose={() => setIsNotebookSelectorOpen(false)}
                notebooks={availableNotebooks}
                currentNotebookId={displayNotebook?.id || ''}
                onSelectNotebook={switchToNotebook}
                onDeleteNotebook={deleteNotebook}
              />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeModal}
        feature={authFeature}
      />
    </div>
  );
}
