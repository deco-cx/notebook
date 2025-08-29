import { createRoute, type RootRoute } from "@tanstack/react-router";
import { Layout } from "../components/layout";

function AppsPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Apps</h1>
        <p className="text-muted-foreground">
          Browse and manage your applications.
        </p>
      </div>
    </Layout>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/apps",
    component: AppsPage,
    getParentRoute: () => parentRoute,
  });
