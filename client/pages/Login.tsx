import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authLogin, authMe, ApiError } from "@/lib/api";
import { AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
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
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { getSafeReturnPath, parseAuthRedirectState } from "@/auth/authRedirect";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState(false);

  const form = useForm<WithRootError<LoginFormValues>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const authRedirect = parseAuthRedirectState(location.state);

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
      try {
        await queryClient.fetchQuery({ queryKey: AUTH_ME_QUERY_KEY, queryFn: authMe });
      } catch (meErr) {
        localStorage.removeItem("apex_token");
        window.dispatchEvent(new Event("apex:auth"));
        form.setError("root", {
          type: "server",
          message:
            meErr instanceof Error ? meErr.message : "Could not load your session. Please try again.",
        });
        return;
      }
      window.dispatchEvent(new Event("apex:auth"));
      const returnTo = getSafeReturnPath(authRedirect.from, "/profile");
      navigate(returnTo, { replace: true });
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <PageMeta
        title={`Sign in | ${COMPANY_NAME}`}
        description={`Sign in to ${COMPANY_NAME} — your sim racing hub.`}
        path="/login"
        noindex
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          {emailVerifiedMessage && (
            <p className="text-sm text-green-500" role="status">
              Email verified. You can sign in now.
            </p>
          )}
          {authRedirect.message && (
            <p className="text-sm text-muted-foreground" role="status">
              {authRedirect.message}
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
                className="text-left text-sm font-medium text-foreground underline hover:no-underline"
              >
                Go to verification
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-muted-foreground underline hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-3 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="pt-2 text-center">
            <Link
              to="/signup"
              state={location.state}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Don&apos;t have an account? Create one
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
