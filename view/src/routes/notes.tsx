import { createRoute, type RootRoute } from "@tanstack/react-router";
import { Layout } from "../components/layout";

function NotesPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Notes</h1>
        <p className="text-muted-foreground">
          All your notes and documentation.
        </p>
      </div>
    </Layout>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/notes",
    component: NotesPage,
    getParentRoute: () => parentRoute,
  });
