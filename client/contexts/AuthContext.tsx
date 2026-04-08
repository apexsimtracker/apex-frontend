import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, registerAuthExpiredHandler, ApiError, type AuthUser } from "@/lib/api";

/** TanStack Query key for GET /api/auth/me — invalidate or setQueryData from profile/settings. */
export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readHasToken(): boolean {
  return typeof localStorage !== "undefined" && Boolean(localStorage.getItem("apex_token"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasTokenState, setHasTokenState] = useState(readHasToken);
  const [error, setError] = useState<string | null>(null);
  const [meRefetching, setMeRefetching] = useState(false);
  const handlingExpiry = useRef(false);

  const syncTokenFromStorage = useCallback(() => {
    setHasTokenState(readHasToken());
  }, []);

  useEffect(() => {
    syncTokenFromStorage();
    const onAuth = () => {
      syncTokenFromStorage();
      void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
    };
    window.addEventListener("apex:auth", onAuth);
    return () => window.removeEventListener("apex:auth", onAuth);
  }, [queryClient, syncTokenFromStorage]);

  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: authMe,
    enabled: hasTokenState,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return false;
      }
      return failureCount < 1;
    },
  });

  // Drop stale user data on unauthorized errors (TanStack Query keeps last success by default).
  useEffect(() => {
    if (!meQuery.isError || !meQuery.error) return;
    const err = meQuery.error;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      queryClient.setQueryData<AuthUser | null>(AUTH_ME_QUERY_KEY, null);
    }
  }, [meQuery.isError, meQuery.error, queryClient]);

  // Mirror previous error semantics from manual refreshUser (network vs generic).
  useEffect(() => {
    if (!hasTokenState) {
      setError(null);
      return;
    }
    if (!meQuery.isError || !meQuery.error) {
      setError(null);
      return;
    }
    const e = meQuery.error;
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      setError(null);
    } else if (e instanceof ApiError && e.status === 0) {
      setError(e.message);
    } else if (e instanceof Error) {
      setError(e.message);
    } else {
      setError("Failed to fetch user.");
    }
  }, [hasTokenState, meQuery.isError, meQuery.error]);

  const user = useMemo(() => {
    if (!hasTokenState) return null;
    if (
      meQuery.isError &&
      meQuery.error instanceof ApiError &&
      (meQuery.error.status === 401 || meQuery.error.status === 403)
    ) {
      return null;
    }
    return meQuery.data ?? null;
  }, [hasTokenState, meQuery.data, meQuery.isError, meQuery.error]);

  // Avoid tying "loading" to isPending alone: v5 can leave status pending while fetchStatus is idle
  // (e.g. paused), which previously blocked the app forever. Treat loading as "has token but no user
  // snapshot yet and no terminal error", plus explicit refreshMe refetch.
  const loading =
    hasTokenState &&
    (meRefetching ||
      (meQuery.data === undefined &&
        !meQuery.isError &&
        (meQuery.isPending || meQuery.fetchStatus === "fetching")));

  const refreshUser = useCallback(async () => {
    if (!readHasToken()) {
      setHasTokenState(false);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      return;
    }
    setError(null);
    await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
  }, [queryClient]);

  const refreshMe = useCallback(async () => {
    if (!readHasToken()) {
      setHasTokenState(false);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      return;
    }
    setMeRefetching(true);
    try {
      await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY });
    } finally {
      setMeRefetching(false);
    }
  }, [queryClient]);

  const setUser = useCallback(
    (next: AuthUser | null) => {
      queryClient.setQueryData<AuthUser | null>(AUTH_ME_QUERY_KEY, next);
    },
    [queryClient]
  );

  // Register global auth expired handler
  useEffect(() => {
    registerAuthExpiredHandler(async () => {
      if (handlingExpiry.current) return;
      handlingExpiry.current = true;

      try {
        if (!readHasToken()) {
          queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      } finally {
        handlingExpiry.current = false;
      }
    });
  }, [queryClient]);

  // Re-run auth when apex_token changes in another tab (same-tab updates use apex:auth → refreshMe).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "apex_token") {
        syncTokenFromStorage();
        void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient, syncTokenFromStorage]);

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
