import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, type MeResponse } from "@/auth/api";
import { clearToken } from "@/auth/token";
import { ApiError } from "@/lib/api";

export default function Profile() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setMe(null);
    try {
      const data = await getMe();
      setMe(data);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setUnauthorized(true);
      } else {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const handleSignOut = () => {
    clearToken();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (unauthorized || !me) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center max-w-md">
          <p className="text-white/80 mb-4">Not signed in.</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-white mb-1">
          {me.user.displayName || "User"}
        </h1>
        <p className="text-white/60 text-sm mb-6">{me.user.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-4 py-2 rounded-lg border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
