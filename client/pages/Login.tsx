import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authLogin } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState(false);

  useEffect(() => {
    const state = location.state as { emailVerified?: boolean } | null;
    if (state?.emailVerified) {
      setEmailVerifiedMessage(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await authLogin(email.trim(), password) as { accessToken?: string; token?: string };
      const token = data.accessToken ?? data.token;
      if (!token || typeof token !== "string") {
        setError("No token returned. Please try again.");
        return;
      }
      localStorage.setItem("apex_token", token);
      window.dispatchEvent(new Event("apex:auth"));
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {emailVerifiedMessage && (
          <p className="text-sm text-green-500" role="status">
            Email verified. You can sign in now.
          </p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-500" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-md text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "rgb(240, 28, 28)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center pt-2">
          <Link
            to="/signup"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Don&apos;t have an account? Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
