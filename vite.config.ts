import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
) as { version?: string };
const appVersion = pkg.version ?? "1.0.0";

export default defineConfig({
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
      "@": path.resolve(__dirname, "src"),
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
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? "http://127.0.0.1:10000",
        changeOrigin: true,
      },
    },
  },
});
