import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
) as { version?: string };
const appVersion = pkg.version ?? "1.0.0";
const gitCommitSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.GIT_COMMIT_SHA?.trim() ||
  "";

export default defineConfig({
  appType: "spa",
  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    "import.meta.env.VITE_GIT_COMMIT_SHA": JSON.stringify(gitCommitSha),
  },

  build: {
    outDir: "dist",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@revenuecat")) return "revenuecat";
          if (id.includes("node_modules/react-share")) return "share";
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "query";
          }
          if (id.includes("node_modules/@radix-ui/")) return "radix";
          if (id.includes("node_modules/lucide-react")) return "lucide";
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/")
          ) {
            return "react-vendor";
          }
        },
      },
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
    host: true,
    proxy: {
      "/api": {
        target:
          process.env.VITE_DEV_API_PROXY_TARGET ?? "http://127.0.0.1:10000",
        changeOrigin: true,
      },
    },
  },
});
