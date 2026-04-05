import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

// Client-only config: no server imports (so DATABASE_URL is not required in CI).
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
) as { version?: string };
const appVersion = rootPkg.version ?? "1.0.0";

/** Production HTML: inject CSP so `connect-src` allows the API origin (same as VITE_API_URL defaults in api.ts). */
function apexCspMetaPlugin(mode: string): Plugin {
  return {
    name: "apex-csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      const env = loadEnv(mode, path.resolve(__dirname, ".."), "");
      const apiBase =
        env.VITE_API_URL ||
        env.VITE_APEX_API_BASE_URL ||
        (mode === "production" ? "https://apex-25ft.onrender.com" : "http://127.0.0.1:10000");
      let apiOrigin = "";
      try {
        apiOrigin = new URL(apiBase).origin;
      } catch {
        apiOrigin = "";
      }
      const connectSrc = ["'self'", apiOrigin].filter(Boolean).join(" ");
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        `connect-src ${connectSrc}`,
        "frame-ancestors 'self'",
      ].join("; ");
      const escaped = csp.replace(/"/g, "&quot;");
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${escaped}" />`;
      return html.replace("<head>", `<head>\n${meta}`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname),
  appType: "spa",
  plugins: [react(), apexCspMetaPlugin(mode)],

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
}));
