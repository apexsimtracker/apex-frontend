import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { verifyEmail, resendVerificationCode, authMe } from "@/lib/api";
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
import {
  verifyEmailCodeSchema,
  type VerifyEmailCodeValues,
} from "@/lib/validation/authPages";
import PageMeta from "@/components/PageMeta";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { authPrimarySolidButtonClassName } from "@/lib/authUi";
import { cn } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { persistSessionTokenFromAuthPayload } from "@/auth/token";

const PENDING_VERIFY_KEY = "apex_verify_email";
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmailState] = useState<string>(() => {
    if (typeof sessionStorage === "undefined") return "";
    return (sessionStorage.getItem(PENDING_VERIFY_KEY) ?? "").trim();
  });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm<WithRootError<VerifyEmailCodeValues>>({
    resolver: zodResolver(verifyEmailCodeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    const fromState = (location.state as { email?: string } | null)?.email;
    const fromStorage =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(PENDING_VERIFY_KEY)
        : null;
    const resolved = (fromState ?? fromStorage ?? "").trim();
    if (resolved) setEmailState(resolved);
  }, [location.state]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function onSubmit(values: VerifyEmailCodeValues) {
    if (!email.trim()) {
      form.setError("root", {
        type: "server",
        message: "Email is missing. Please sign up again.",
      });
      return;
    }
    form.clearErrors("root");
    setSuccess(null);
    setLoading(true);
    const trimmedCode = values.code.trim();
    try {
      const data = await verifyEmail(email, trimmedCode);
      const token = data.accessToken ?? data.token;
      if (token && typeof token === "string") {
        localStorage.setItem("apex_token", token);
        persistSessionTokenFromAuthPayload(data);
        sessionStorage.removeItem(PENDING_VERIFY_KEY);
        try {
          await queryClient.fetchQuery({
            queryKey: AUTH_ME_QUERY_KEY,
            queryFn: authMe,
          });
          prefetchHomeWeeklyAfterAuth(
            queryClient,
            queryClient.getQueryData(AUTH_ME_QUERY_KEY),
          );
        } catch (meErr) {
          localStorage.removeItem("apex_token");
          persistSessionTokenFromAuthPayload({});
          sessionStorage.setItem(PENDING_VERIFY_KEY, email);
          window.dispatchEvent(new Event("apex:auth"));
          form.setError("root", {
            type: "server",
            message:
              meErr instanceof Error
                ? meErr.message
                : "Could not load your session. Please try signing in.",
          });
          return;
        }
        window.dispatchEvent(new Event("apex:auth"));
        navigate("/profile", { replace: true });
        return;
      }
      sessionStorage.removeItem(PENDING_VERIFY_KEY);
      setSuccess("Email verified. You can sign in now.");
      setTimeout(
        () =>
          navigate("/login", { replace: true, state: { emailVerified: true } }),
        1500,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      form.setError("root", { type: "server", message: msg });
    } finally {
      setLoading(false);
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      form.setError("root", {
        type: "server",
        message: "Email is missing. Please sign up again.",
      });
      return;
    }
    if (resendCooldown > 0) return;
    form.clearErrors("root");
    setSuccess(null);
    setResendLoading(true);
    try {
      const data = await resendVerificationCode(email);
      setSuccess("A new verification code has been sent.");
      const nextIn =
        data.nextResendInSeconds ??
        (data.resendAt
          ? Math.max(0, data.resendAt - Math.floor(Date.now() / 1000))
          : null);
      setResendCooldown(nextIn ?? RESEND_COOLDOWN_SEC);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      if (
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("code")
      ) {
        form.setError("root", {
          type: "server",
          message: "Code expired. Request a new one.",
        });
      } else {
        form.setError("root", { type: "server", message: msg });
      }
    } finally {
      setResendLoading(false);
    }
  };

  const hasStoredEmail =
    typeof sessionStorage !== "undefined" &&
    (sessionStorage.getItem(PENDING_VERIFY_KEY) ?? "").trim().length > 0;
  if (!email.trim() && !hasStoredEmail) {
    return (
      <AuthPageShell>
        <PageMeta
          title={`Verify email | ${COMPANY_NAME}`}
          description={`Verify your ${COMPANY_NAME} account email.`}
          path="/verify-email"
          noindex
        />
        <div className="w-full space-y-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Verification
          </h1>
          <p className="text-sm text-muted-foreground">
            Missing email. Please sign up again.
          </p>
          <Link
            to="/signup"
            className={cn(
              "inline-block w-full rounded-md px-4 py-2 text-center font-medium transition-opacity hover:opacity-90",
              authPrimarySolidButtonClassName,
            )}
          >
            Go to Sign up
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  const hasEmail = email.trim().length > 0;
  const codeWatch = form.watch("code");
  const canSubmit = hasEmail && Boolean(codeWatch?.trim()) && !loading;
  const canResend = hasEmail && resendCooldown === 0 && !resendLoading;

  return (
    <AuthPageShell>
      <PageMeta
        title={`Verify email | ${COMPANY_NAME}`}
        description={`Verify your ${COMPANY_NAME} account email.`}
        path="/verify-email"
        noindex
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to your email.
          </p>
          {hasEmail && (
            <p className="break-all text-sm font-medium text-foreground/90">
              {email}
            </p>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  Verification code
                </FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={loading}
                    placeholder="Enter code"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormRootMessage />
          {success && (
            <div className="text-sm text-green-500" role="status">
              {success}
            </div>
          )}

          <AuthPrimaryButton type="submit" disabled={!canSubmit}>
            {loading ? "Verifying…" : "Verify"}
          </AuthPrimaryButton>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!canResend}
              onClick={handleResend}
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : resendLoading
                  ? "Sending…"
                  : "Resend code"}
            </button>
            <Link
              to="/login"
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Back to Sign in
            </Link>
          </div>
        </form>
      </Form>
    </AuthPageShell>
  );
}
