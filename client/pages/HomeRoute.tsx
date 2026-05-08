import { useAuth } from "@/contexts/AuthContext";
import Index from "./Index";
import PublicHome from "./PublicHome";

export default function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Index />;
  }

  return <PublicHome />;
}
