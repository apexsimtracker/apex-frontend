// Public API: stable exports for `import { ... } from "@/lib/api"`.
// Env: `VITE_API_URL` / `VITE_APEX_API_BASE_URL` — see `config.ts` (replicates prior `api.ts` resolution).
export * from "./config";
export * from "./errors";
export {
  fetchApi,
  registerAuthExpiredHandler,
  PRO_REQUIRED_EVENT,
} from "./fetchClient";
export * from "./httpVerbs";
export * from "./profile";
export * from "./community";
export * from "./followAndLeaderboards";
export * from "./authAndContact";
export * from "./adminMetrics";
export * from "./dataExport";
export * from "./activityBilling";
export * from "./manualAndUpload";
export * from "./challenges";
