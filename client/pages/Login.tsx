import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authLogin, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import { loginFormSchema, type LoginFormValues } from "@/lib/validation/authPages";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState(false);

  const form = useForm<WithRootError<LoginFormValues>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const state = location.state as { emailVerified?: boolean } | null;
    if (state?.emailVerified) {
      setEmailVerifiedMessage(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  async function onSubmit(values: LoginFormValues) {
    form.clearErrors("root");
    setEmailNotVerified(false);
    setLoading(true);
    const trimmedEmail = values.email.trim();
    try {
      const data = (await authLogin(trimmedEmail, values.password)) as {
        accessToken?: string;
        token?: string;
      };
      const token = data.accessToken ?? data.token;
      if (!token || typeof token !== "string") {
        form.setError("root", {
          type: "server",
          message: "No token returned. Please try again.",
        });
        return;
      }
      localStorage.setItem("apex_token", token);
      window.dispatchEvent(new Event("apex:auth"));
      navigate("/profile", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
        form.setError("root", {
          type: "server",
          message: "Please verify your email before signing in.",
        });
      } else {
        form.setError("root", {
          type: "server",
          message: err instanceof Error ? err.message : "Login failed.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          {emailVerifiedMessage && (
            <p className="text-sm text-green-500" role="status">
              Email verified. You can sign in now.
            </p>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormRootMessage />
          {emailNotVerified && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const e = form.getValues("email").trim();
                  if (e) sessionStorage.setItem("apex_verify_email", e);
                  navigate("/verify-email", { state: { email: e } });
                }}
                className="text-sm text-foreground underline hover:no-underline font-medium text-left"
              >
                Go to verification
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Forgot password?
            </button>
          </div>

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
      </Form>
    </div>
  );
}
