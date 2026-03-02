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
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },

  server: {
    port: 8080,
  },
});
