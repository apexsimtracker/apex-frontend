import { useAuth } from "@/contexts/AuthContext";
import V2Layout from "@/components/v2/V2Layout";
import V2BottomNavV2 from "@/components/v2/V2BottomNavV2";
import DashboardV2 from "@/pages/v2/DashboardV2";
import DashboardTopBarV2 from "@/pages/v2/dashboard/DashboardTopBarV2";
import PublicHomeV2 from "@/pages/v2/PublicHomeV2";
import PublicHomeTopBarV2 from "@/pages/v2/public-home/PublicHomeTopBarV2";

export default function HomeRouteV2() {
  const { user } = useAuth();

  if (user) {
    return (
      <V2Layout topBar={<DashboardTopBarV2 />} bottomBar={<V2BottomNavV2 />}>
        <DashboardV2 />
      </V2Layout>
    );
  }

  return (
    <V2Layout topBar={<PublicHomeTopBarV2 />} bottomBar={<V2BottomNavV2 />}>
      <PublicHomeV2 />
    </V2Layout>
  );
}
