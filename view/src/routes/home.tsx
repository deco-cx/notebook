import { createRoute, type RootRoute } from "@tanstack/react-router";
import { App } from "../App";

function HomePage() { return <App />; }

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/",
    component: HomePage,
    getParentRoute: () => parentRoute,
  });