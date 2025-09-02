import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact(), tailwindcss()],
  build: {
    outDir: "../server/view-build/",
    emptyOutDir: true,
    // Reduce number of output files
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Merge all chunks (including dynamic imports) into a single bundle name
        manualChunks: () => "bundle",
      },
    },
  },
  server: {
    strictPort: true,
    proxy: {
      "/mcp": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
