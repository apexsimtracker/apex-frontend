import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

/** Prefer client/node_modules, then parent (apex-frontend/) — avoids duplicate React when deps are split. */
function resolveModuleDir(name: string): string {
  const local = path.resolve(__dirname, "node_modules", name);
  const parent = path.resolve(__dirname, "..", "node_modules", name);
  if (existsSync(local)) return local;
  if (existsSync(parent)) return parent;
  return local;
}

// Client-only config: no server imports (so DATABASE_URL is not required in CI).
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
) as { version?: string };
const appVersion = rootPkg.version ?? "1.0.0";

const reactDir = resolveModuleDir("react");
const reactDomDir = resolveModuleDir("react-dom");

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
      react: reactDir,
      "react-dom": reactDomDir,
      "react/jsx-runtime": path.join(reactDir, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactDir, "jsx-dev-runtime.js"),
    },
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "react-paginate",
    ],
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
