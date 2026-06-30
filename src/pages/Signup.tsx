import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authRegister, authMe } from "@/lib/api";
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
  signupFormSchema,
  type SignupFormValues,
} from "@/lib/validation/authPages";
import PageMeta from "@/components/PageMeta";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { getSafeReturnPath, parseAuthRedirectState } from "@/auth/authRedirect";
import { persistSessionTokenFromAuthPayload } from "@/auth/token";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const authRedirect = parseAuthRedirectState(location.state);
  const [loading, setLoading] = useState(false);

  const form = useForm<WithRootError<SignupFormValues>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    form.clearErrors("root");
    setLoading(true);
    const trimmedEmail = values.email.trim();
    try {
      const data = await authRegister(
        trimmedEmail,
        values.password,
        values.name.trim() || undefined,
      );
      const token = data.accessToken ?? data.token;
      const hasToken = token && typeof token === "string";

      if (hasToken && !data.requiresVerification) {
        localStorage.setItem("apex_token", token as string);
        persistSessionTokenFromAuthPayload(data as { sessionToken?: string });
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
        const returnTo = getSafeReturnPath(authRedirect.from, "/profile");
        navigate(returnTo, { replace: true });
        return;
      }

      sessionStorage.setItem("apex_verify_email", trimmedEmail);
      navigate("/verify-email", {
        replace: true,
        state: { email: trimmedEmail },
      });
    } catch (err) {
      form.setError("root", {
        type: "server",
        message:
          err instanceof Error
            ? err.message
            : "Signup failed. Email may already exist.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <PageMeta
        title={`Create account | ${COMPANY_NAME}`}
        description={`Join ${COMPANY_NAME} — sim racing sessions, leaderboards, and community.`}
        path="/signup"
        noindex
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create account
          </h1>
          {authRedirect.message && (
            <p className="text-sm text-muted-foreground" role="status">
              {authRedirect.message}
            </p>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="name"
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
                    autoComplete="new-password"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormRootMessage />

          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </AuthPrimaryButton>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link
              to="/terms-and-conditions"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="pt-2 text-center">
            <Link
              to="/login"
              state={location.state}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Already have an account? Sign in
            </Link>
          </p>
        </form>
      </Form>
    </AuthPageShell>
  );
}
