import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";
import { urlToInAppPath } from "@/lib/capacitor/nativeDeepLinks";

function openInApp(
  raw: string | undefined,
  navigate: ReturnType<typeof useNavigate>,
): void {
  if (!raw) return;
  const path = urlToInAppPath(raw);
  if (!path) return;
  navigate(path);
}

/** Universal Links / App Links → React Router. Web no-op. */
export default function NativeDeepLinkListener() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    // getLaunchUrl is the cold-start URL and stays set for the process.
    // Do not re-read it when useNavigate() identity changes (BrowserRouter).
    void App.getLaunchUrl()
      .then((result) => {
        if (cancelled) return;
        openInApp(result?.url, navigateRef.current);
      })
      .catch(() => undefined);

    const handle = App.addListener("appUrlOpen", (event) => {
      openInApp(event.url, navigateRef.current);
    });

    return () => {
      cancelled = true;
      void handle.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
