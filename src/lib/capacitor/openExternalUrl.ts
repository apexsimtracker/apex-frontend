import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/** Open an external URL in the system browser on native; same-tab navigation on web. */
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.location.assign(url);
}
