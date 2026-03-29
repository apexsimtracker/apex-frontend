import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

// Client-only config: no server imports (so DATABASE_URL is not required in CI).
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
) as { version?: string };
const appVersion = rootPkg.version ?? "0.0.0";

export default defineConfig({
  root: path.resolve(__dirname),
  appType: "spa",
  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },

  build: {
    outDir: "dist",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },

  server: {
    port: 8080,
    // Forward /api to local Fastify so same-origin requests work if you use a relative API base.
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? "http://127.0.0.1:10000",
        changeOrigin: true,
      },
    },
  },
});
