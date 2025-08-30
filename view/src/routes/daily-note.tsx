import { createRoute, type RootRoute } from "@tanstack/react-router";
import { Layout } from "../components/layout";

function DailyNotePage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Daily Note</h1>
        <p className="text-muted-foreground">
          Your daily notes and thoughts go here.
        </p>
      </div>
    </Layout>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/daily-note",
    component: DailyNotePage,
    getParentRoute: () => parentRoute,
  });
