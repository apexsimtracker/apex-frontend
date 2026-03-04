import "./global.css";

import { createRoot } from "react-dom/client";
import App from "./App";

// One-time cleanup: unregister any stale service workers and clear caches
// so users who had a PWA/SW get fresh JS (fixes "Sign in" doing nothing until DevTools + refresh).
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

clearStaleCaches().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
