import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authLogin, authMe, ApiError } from "@/lib/api";
import { AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import { prefetchHomeWeeklyAfterAuth } from "@/lib/profileQueryKeys";
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
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { getSafeReturnPath, parseAuthRedirectState } from "@/auth/authRedirect";
import { persistSessionTokenFromAuthPayload } from "@/auth/token";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState(false);
  const [suspendedReason, setSuspendedReason] = useState<string | null | undefined>(undefined);

  const form = useForm<WithRootError<LoginFormValues>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const authRedirect = parseAuthRedirectState(location.state);
  const returnFromQuery = searchParams.get("next");
  const postLoginPath = getSafeReturnPath(
    authRedirect.from ?? returnFromQuery,
    "/profile"
  );

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
    setSuspendedReason(undefined);
    setLoading(true);
    const trimmedEmail = values.email.trim();
    try {
      const data = await authLogin(trimmedEmail, values.password);
      const token = data.accessToken ?? data.token;
      if (!token || typeof token !== "string") {
        form.setError("root", {
          type: "server",
          message: "No token returned. Please try again.",
        });
        setLoading(false);
        return;
      }
      localStorage.setItem("apex_token", token);
      persistSessionTokenFromAuthPayload(data);
      try {
        await queryClient.fetchQuery({ queryKey: AUTH_ME_QUERY_KEY, queryFn: authMe });
        prefetchHomeWeeklyAfterAuth(
          queryClient,
          queryClient.getQueryData(AUTH_ME_QUERY_KEY)
        );
      } catch (meErr) {
        localStorage.removeItem("apex_token");
        persistSessionTokenFromAuthPayload({});
        window.dispatchEvent(new Event("apex:auth"));
        form.setError("root", {
          type: "server",
          message:
            meErr instanceof Error ? meErr.message : "Could not load your session. Please try again.",
        });
        setLoading(false);
        return;
      }
      window.dispatchEvent(new Event("apex:auth"));
      navigate(postLoginPath, { replace: true });
      return;
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
        form.setError("root", {
          type: "server",
          message: "Please verify your email before signing in.",
        });
      } else if (err instanceof ApiError && err.code === "ACCOUNT_SUSPENDED") {
        setSuspendedReason(
          err.suspensionReason != null && err.suspensionReason.trim() !== ""
            ? err.suspensionReason.trim()
            : null
        );
      } else {
        form.setError("root", {
          type: "server",
          message: err instanceof Error ? err.message : "Login failed.",
        });
      }
      setLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <PageMeta
        title={`Sign in | ${COMPANY_NAME}`}
        description={`Sign in to ${COMPANY_NAME} — your sim racing hub.`}
        path="/login"
        noindex
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
          aria-busy={loading || undefined}
        >
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
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
          {suspendedReason !== undefined && (
            <div
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-3 text-sm text-red-100"
              role="alert"
            >
              <p className="font-medium text-red-50">
                Your account has been suspended from this platform.
              </p>
              {suspendedReason ? (
                <p className="mt-2 text-red-100/90">
                  <span className="text-white/70">Reason: </span>
                  {suspendedReason}
                </p>
              ) : null}
              <p className="mt-3 text-red-100/90">
                If you believe this is a mistake, please visit our{" "}
                <Link to="/contact" className="font-medium text-red-50 underline hover:no-underline">
                  contact page
                </Link>{" "}
                and reach out to the team.
              </p>
            </div>
          )}
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

          <AuthPrimaryButton type="submit" loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </AuthPrimaryButton>

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
    </AuthPageShell>
  );
}
