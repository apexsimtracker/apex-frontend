import "./global.css";

import { createRoot } from "react-dom/client";
import App from "./App";

declare global {
  interface Window {
    __APEX_MOUNTED__?: boolean;
  }
}

// One-time cleanup: unregister any stale service workers and clear caches
async function clearStaleCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    regs.forEach((reg) => reg.unregister());
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    keys.forEach((k) => caches.delete(k));
  }
}

window.__APEX_MOUNTED__ = false;
clearStaleCaches().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
  window.__APEX_MOUNTED__ = true;
});
