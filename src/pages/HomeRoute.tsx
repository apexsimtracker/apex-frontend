import { lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = lazy(() =>
  import(/* webpackChunkName: "home-dashboard" */ "@/pages/Dashboard"),
);
const PublicHome = lazy(() =>
  import(/* webpackChunkName: "home-public" */ "@/pages/PublicHome"),
);

/** Home page content only — chrome + Suspense live in ProductAppLayout. */
export default function HomeRoute() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <PublicHome />;
}
