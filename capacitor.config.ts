import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.apexsimtracker.app",
  appName: "Apex",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    // WebView is https://localhost; local API is http://10.0.2.2 — without this, fetch fails silently.
    allowMixedContent: true,
  },
};

export default config;
