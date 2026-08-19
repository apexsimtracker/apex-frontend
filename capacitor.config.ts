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
  plugins: {
    SplashScreen: {
      // Matches the generated splash artwork background, so there is no flash before the WebView paints.
      backgroundColor: "#070915",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
