import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import HomePage from "./routes/home.tsx";
import DailyNotePage from "./routes/daily-note.tsx";
import NotesPage from "./routes/notes.tsx";
import WorkflowsPage from "./routes/workflows.tsx";
import AppsPage from "./routes/apps.tsx";
import ViewsHomePage from "./routes/views-home.tsx";
import { Toaster } from "sonner";

import "./styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { enableStorageDebug } from "./lib/storageDebug";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const routeTree = rootRoute.addChildren([
  HomePage(rootRoute),
  DailyNotePage(rootRoute),
  NotesPage(rootRoute),
  WorkflowsPage(rootRoute),
  AppsPage(rootRoute),
  ViewsHomePage(rootRoute),
]);

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Global function to clear all notebook data
(window as any).clearData = () => {
  console.log('🧹 Clearing all data...');
  
  // Clear localStorage
  localStorage.clear();
  console.log('  ✅ localStorage cleared');
  
  // Clear sessionStorage too
  sessionStorage.clear();
  console.log('  ✅ sessionStorage cleared');
  
  // Clear IndexedDB if exists
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`  ✅ IndexedDB ${db.name} deleted`);
        }
      });
    }).catch(e => console.log('  ⚠️ Could not clear IndexedDB:', e));
  }
  
  console.log('🔄 Refreshing in 1 second...');
  setTimeout(() => {
    window.location.href = window.location.origin;
  }, 1000);
};

// Nuclear option - force clear and redirect
(window as any).nukeData = () => {
  console.log('☢️ NUCLEAR CLEAR INITIATED!');
  
  // Clear everything
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Delete all cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear cache if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  } catch (e) {
    console.error('Error during nuclear clear:', e);
  }
  
  console.log('☢️ Forcing hard refresh to root...');
  window.location.href = window.location.origin + '?t=' + Date.now();
};

// Global function to show current data
(window as any).showData = () => {
  console.log('📊 === STORAGE REPORT ===');
  
  // Check localStorage
  const data = localStorage.getItem('notebooks');
  if (data) {
    try {
      const notebooks = JSON.parse(data);
      console.log('📚 localStorage notebooks:', notebooks);
      Object.keys(notebooks).forEach(id => {
        console.log(`  - ${id}: ${notebooks[id].cells.length} cells`);
        notebooks[id].cells.forEach((cell: any, i: number) => {
          console.log(`    [${i}] ${cell.type} (id: ${cell.id})`);
        });
      });
    } catch (e) {
      console.log('❌ Error parsing notebooks:', e);
      console.log('Raw data:', data);
    }
  } else {
    console.log('📚 No notebooks in localStorage');
  }
  
  // Check all localStorage keys
  console.log('🔑 All localStorage keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
  }
  
  console.log('📊 === END REPORT ===');
};

console.log('💡 Commands available:');
console.log('  clearData() - Clear all data and refresh');
console.log('  nukeData()  - Nuclear option, force clear everything');
console.log('  showData()  - Show detailed storage report');

// Enable storage debug if requested
try { enableStorageDebug(); } catch {}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  );
}
