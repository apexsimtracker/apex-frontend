import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { authMe, registerAuthExpiredHandler, ApiError, type AuthUser } from "@/lib/api";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handlingExpiry = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const data = await authMe();
      setUser(data);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setUser(null);
      } else if (e instanceof ApiError && e.status === 0) {
        setError(e.message);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to fetch user.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await authMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Register global auth expired handler
  useEffect(() => {
    registerAuthExpiredHandler(async () => {
      if (handlingExpiry.current) return;
      handlingExpiry.current = true;

      try {
        const data = await authMe();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        handlingExpiry.current = false;
      }
    });
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Re-run auth when apex_token changes (e.g. login in another tab, or token cleared).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "apex_token") {
        refreshUser();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshUser]);

  // Same-tab auth update: when token is set (e.g. after login), refresh user and loading state.
  useEffect(() => {
    const handler = () => refreshMe();
    window.addEventListener("apex:auth", handler);
    return () => window.removeEventListener("apex:auth", handler);
  }, [refreshMe]);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useIsProUser(): boolean {
  const { user, loading } = useAuth();
  if (loading) return false;
  return user?.hasPro === true;
}
