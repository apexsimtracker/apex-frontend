import type { UseFormReturn } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import type { LoginFormValues } from "@/lib/validation/authPages";
import {
  v2InputClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

const formLabelClassName =
  "font-v2-body text-[10px] uppercase text-v2-on-surface-variant";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-6 sm:p-8";

type LoginFormCardV2Props = {
  form: UseFormReturn<WithRootError<LoginFormValues>>;
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  loading: boolean;
  emailVerifiedMessage: boolean;
  authRedirectMessage?: string;
  emailNotVerified: boolean;
  suspendedReason: string | null | undefined;
};

export default function LoginFormCardV2({
  form,
  onSubmit,
  loading,
  emailVerifiedMessage,
  authRedirectMessage,
  emailNotVerified,
  suspendedReason,
}: LoginFormCardV2Props) {
  const navigate = useNavigate();

  return (
    <div className={formCardClassName}>
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="mb-4 flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary lg:hidden"
          aria-hidden
        >
          <LogIn className="size-5" />
        </div>
        <p className={cn(sectionEyebrowClassName, "lg:hidden")}>
          Account access
        </p>
        <h2 className="mt-2 font-v2-headline text-lg font-semibold text-v2-on-surface lg:mt-0">
          Sign in
        </h2>
      </div>

      {emailVerifiedMessage && (
        <div
          className="mb-6 flex gap-3 rounded-v2-lg border border-v2-success/30 bg-v2-success/10 p-5"
          role="status"
        >
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-v2-success"
            aria-hidden
          />
          <div>
            <p className="font-v2-headline font-medium text-v2-success">
              Email verified
            </p>
            <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
              You can sign in now.
            </p>
          </div>
        </div>
      )}

      {authRedirectMessage && (
        <p
          className="mb-6 rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low px-4 py-3 font-v2-body text-sm text-v2-on-surface-variant"
          role="status"
        >
          {authRedirectMessage}
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-busy={loading || undefined}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>Email</label>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={loading}
                    className={v2InputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>Password</label>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    disabled={loading}
                    className={v2InputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormRootMessage className="text-xs text-v2-error" />

          {suspendedReason !== undefined && (
            <div
              className="rounded-v2-lg border border-v2-error/30 bg-v2-error/10 p-5"
              role="alert"
            >
              <p className="font-v2-headline font-medium text-v2-error">
                Your account has been suspended from this platform.
              </p>
              {suspendedReason ? (
                <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
                  <span className="text-v2-on-surface-variant/70">
                    Reason:{" "}
                  </span>
                  {suspendedReason}
                </p>
              ) : null}
              <p className="mt-3 font-v2-body text-sm text-v2-on-surface-variant">
                If you believe this is a mistake, please visit our{" "}
                <Link
                  to="/v2/contact"
                  className="text-v2-primary transition-colors hover:text-v2-primary/80"
                >
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
                  navigate("/v2/verify-email", { state: { email: e } });
                }}
                className="text-left font-v2-body text-sm text-v2-primary transition-colors hover:text-v2-primary/80"
              >
                Go to verification
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/v2/forgot-password")}
              className="font-v2-body text-sm text-v2-on-surface transition-colors hover:text-v2-on-surface/80"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={cn("w-full", v2PrimaryButtonClassName)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
