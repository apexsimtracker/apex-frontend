import { useAuth } from "@/contexts/AuthContext";
import Index from "./Index";
import PublicHome from "./PublicHome";

export default function HomeRoute() {
  const { user } = useAuth();

  if (user) {
    return <Index />;
  }

  return <PublicHome />;
}
