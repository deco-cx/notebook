import { createRoute, type RootRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGetNotebook, useGetOrCreateDailyNote } from '../hooks/useNotebookServer';
import { useAuth } from '../hooks/useAuth';
import { App } from '../App'; // Reuse the existing App component

function NotebookRoute() {
  const { notebookId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notebookData } = useGetNotebook(notebookId);
  const { data: dailyNoteData } = useGetOrCreateDailyNote();

  useEffect(() => {
    // Redirect to daily note if no specific notebook and user is logged in
    if (!notebookId && dailyNoteData?.notebook && user) {
      navigate({ 
        to: '/notebook/$notebookId', 
        params: { notebookId: dailyNoteData.notebook.id },
        replace: true 
      });
    }
  }, [notebookId, dailyNoteData, navigate, user]);

  // Pass the notebook data to the App component
  const notebook = notebookData?.notebook || dailyNoteData?.notebook;

  return <App initialNotebook={notebook} />;
}

export const Route = createRoute({
  getParentRoute: () => parentRoute,
  path: '/notebook/$notebookId',
  component: NotebookRoute,
});

export default (parentRoute: RootRoute) => 
  createRoute({
    getParentRoute: () => parentRoute,
    path: '/notebook/$notebookId',
    component: NotebookRoute,
  });
