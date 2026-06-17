import { Capacitor } from "@capacitor/core";

export function usePlatform() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  return { isNative, isWeb: !isNative, platform };
}
