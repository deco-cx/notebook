import { createRoute, type RootRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { HomeInset } from "../components/HomeInset";
import { useNotebooks } from "../hooks/useNotebooks";

function ViewsHomePage() {
  const [isNotebookSelectorOpen, setIsNotebookSelectorOpen] = useState(false);
  const {
    currentNotebook,
    availableNotebooks,
    createNewNotebook,
    switchToNotebook,
    updateCurrentNotebook,
    deleteNotebook,
  } = useNotebooks();

  const handleOpenNotebook = () => setIsNotebookSelectorOpen(true);

  return (
    <div className="min-h-screen p-4">
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
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/views/home",
    component: ViewsHomePage,
    getParentRoute: () => parentRoute,
  });


