import { lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import BottomNav from "@/components/BottomNav";
import DashboardTopBar from "@/pages/dashboard/DashboardTopBar";
import PublicHomeTopBar from "@/pages/public-home/PublicHomeTopBar";
import DashboardSkeleton from "@/pages/dashboard/DashboardSkeleton";
import { GenericRouteSkeleton } from "@/routes/GenericRouteSkeleton";
import { PageSuspense } from "@/routes/PageSuspense";

const Dashboard = lazy(() =>
  import(/* webpackChunkName: "home-dashboard" */ "@/pages/Dashboard"),
);
const PublicHome = lazy(() =>
  import(/* webpackChunkName: "home-public" */ "@/pages/PublicHome"),
);

export default function HomeRoute() {
  const { user } = useAuth();

  if (user) {
    return (
      <AppLayout topBar={<DashboardTopBar />} bottomBar={<BottomNav />}>
        <PageSuspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </PageSuspense>
      </AppLayout>
    );
  }

  return (
    <AppLayout topBar={<PublicHomeTopBar />} bottomBar={<BottomNav />}>
      <PageSuspense fallback={<GenericRouteSkeleton />}>
        <PublicHome />
      </PageSuspense>
    </AppLayout>
  );
}
