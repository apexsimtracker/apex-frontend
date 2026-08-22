import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

/** Pages that must not ship as part of the store binary UX (admin, agent installers). */
export default function WebOnlyRoute({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
