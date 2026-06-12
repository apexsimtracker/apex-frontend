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
export * from "./userDiscover";
export * from "./authAndContact";
export * from "./adminMetrics";
export * from "./dataExport";
export * from "./activityBilling";
export * from "./manualAndUpload";
export * from "./challenges";
export * from "./adminUsers";
export * from "./adminSubscriptions";
export * from "./adminContact";
export * from "./adminCommunity";
export * from "./adminLeaderboards";
export * from "./adminCatalog";
export * from "./adminSessions";
export * from "./adminDevices";
export * from "./adminAgentReleases";
export * from "./adminFollows";
export * from "./adminNotifications";
export * from "./adminEmailOps";
export * from "./adminSystem";
export * from "./broadcasts";
