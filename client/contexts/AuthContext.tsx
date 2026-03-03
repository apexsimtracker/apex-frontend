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
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handlingExpiry = useRef(false);

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
    }
  }, []);

  // Strict loading gate: call /api/auth/me on mount, set loading=false only in finally, alive flag to avoid setState after unmount
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError(null);
        const data = await authMe();
        if (alive) setUser(data);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setUser(null);
        } else if (e instanceof ApiError && e.status === 0) {
          setError(e.message);
        } else {
          const msg = e instanceof Error ? e.message : "Failed to fetch user.";
          setError(msg);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser, setUser }}>
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
