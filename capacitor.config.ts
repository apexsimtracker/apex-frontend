import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.apexsimtracker.app",
  appName: "Apex",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    // Store / staging APIs are HTTPS. Mixed content is only for local HTTP
    // (10.0.2.2); live-reload scripts may toggle this — do not commit it true.
    allowMixedContent: false,
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
