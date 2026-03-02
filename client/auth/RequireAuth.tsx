import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/auth/token";

type RequireAuthProps = {
  children?: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const token = getToken();
  if (!token || token.trim() === "") {
    return <Navigate to="/login" replace />;
  }
  return children ?? <Outlet />;
}
