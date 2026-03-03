import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { setToken } from "@/auth/token";

type RegisterResponse = { accessToken?: string };

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetchApi<RegisterResponse>("POST", "/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      }, true);
      if (response.accessToken) {
        setToken(response.accessToken);
      }
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Create account</h1>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

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
            autoComplete="new-password"
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
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
