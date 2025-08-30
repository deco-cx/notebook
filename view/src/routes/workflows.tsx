import { createRoute, type RootRoute } from "@tanstack/react-router";
import { Layout } from "../components/layout";

function WorkflowsPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
        <p className="text-muted-foreground">
          Manage your automated workflows and processes.
        </p>
      </div>
    </Layout>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/workflows",
    component: WorkflowsPage,
    getParentRoute: () => parentRoute,
  });
