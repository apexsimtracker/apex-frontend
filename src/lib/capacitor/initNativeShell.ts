import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await SplashScreen.hide();
  await StatusBar.setStyle({ style: Style.Dark });
  await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
}
