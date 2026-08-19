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
  await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
}
