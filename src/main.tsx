import "./global.css";

import { createRoot } from "react-dom/client";
import App from "./App";
import { initNativeShell } from "./lib/capacitor/initNativeShell";
import { initApexRum } from "./lib/apexRum";

declare global {
  interface Window {
    __APEX_MOUNTED__?: boolean;
  }
}

window.__APEX_MOUNTED__ = false;
createRoot(document.getElementById("root")!).render(<App />);
window.__APEX_MOUNTED__ = true;
void initNativeShell();
initApexRum();
