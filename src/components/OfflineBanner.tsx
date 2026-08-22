import { useEffect, useState } from "react";

function readOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

/** Slim product-chrome banner; sits in main below the header. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(readOffline);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    setOffline(readOffline());
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="border-b border-apex-outline-variant/15 bg-apex-surface-container-high px-4 py-2 text-center font-apex-body text-xs text-apex-on-surface-variant sm:text-sm"
    >
      You’re offline. Some actions won’t work until you’re back online.
    </div>
  );
}
