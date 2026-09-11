import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

function waitForFirstPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Keep the native splash up until the WebView has actually painted its first
  // (dark) frame, so hiding the splash never reveals a white screen.
  await waitForFirstPaint();
  await SplashScreen.hide();
  await StatusBar.setStyle({ style: Style.Dark });

  // Android has no setResizeMode implementation — it rejects UNIMPLEMENTED and
  // takes the rest of this function down with it. Its resize behaviour comes
  // from the native Keyboard config instead.
  if (Capacitor.getPlatform() === "ios") {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  }

  await publishAndroidStatusBarInset();
}

/**
 * iOS gets its top inset from `env(safe-area-inset-top)`. Android WebViews
 * report 0 for that variable even though the page is laid out behind the status
 * bar, so app chrome has to size itself from the measured height instead.
 */
async function publishAndroidStatusBarInset(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;

  const { height } = await StatusBar.getInfo();
  document.documentElement.style.setProperty(
    "--apex-safe-area-top",
    `${height}px`,
  );
}
