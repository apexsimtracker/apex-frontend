import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authRegister } from "@/lib/api";
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
import { signupFormSchema, type SignupFormValues } from "@/lib/validation/authPages";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { getSafeReturnPath, parseAuthRedirectState } from "@/auth/authRedirect";

const inputClass = "w-full px-3 py-2 border rounded-md bg-transparent";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
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
      const data = await authRegister(trimmedEmail, values.password, values.name.trim() || undefined);
      const token = data.accessToken ?? data.token;
      const hasToken = token && typeof token === "string";

      if (hasToken && !data.requiresVerification) {
        localStorage.setItem("apex_token", token as string);
        window.dispatchEvent(new Event("apex:auth"));
        const returnTo = getSafeReturnPath(authRedirect.from, "/profile");
        navigate(returnTo, { replace: true });
        return;
      }

      sessionStorage.setItem("apex_verify_email", trimmedEmail);
      navigate("/verify-email", { replace: true, state: { email: trimmedEmail } });
    } catch (err) {
      form.setError("root", {
        type: "server",
        message:
          err instanceof Error ? err.message : "Signup failed. Email may already exist.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <PageMeta
        title={`Create account | ${COMPANY_NAME}`}
        description={`Join ${COMPANY_NAME} — sim racing sessions, leaderboards, and community.`}
        path="/signup"
        noindex
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold">Create account</h1>
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormRootMessage />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-3 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>

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
    </div>
  );
}
