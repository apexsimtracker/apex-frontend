import type { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
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
import type { VerifyEmailCodeValues } from "@/lib/validation/authPages";
import {
  appInputClassName,
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

const formLabelClassName =
  "font-apex-body text-[10px] uppercase text-apex-on-surface-variant";

const sectionEyebrowClassName =
  "font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-apex-outline-variant/15 bg-gradient-to-b from-apex-surface-container to-apex-background p-6 sm:p-8";

type VerifyEmailFormCardProps = {
  form: UseFormReturn<WithRootError<VerifyEmailCodeValues>>;
  email: string;
  loading: boolean;
  resendLoading: boolean;
  success: string | null;
  resendCooldown: number;
  canSubmit: boolean;
  canResend: boolean;
  missingEmail: boolean;
  onSubmit: (values: VerifyEmailCodeValues) => void | Promise<void>;
  onResend: () => void | Promise<void>;
};

function CardHeader({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Mail;
}) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div
        className="mb-4 flex size-10 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary lg:hidden"
        aria-hidden
      >
        <Icon className="size-5" />
      </div>
      <p className={cn(sectionEyebrowClassName, "lg:hidden")}>{eyebrow}</p>
      <h2 className="mt-2 font-apex-headline text-lg font-semibold text-apex-on-surface lg:mt-0">
        {title}
      </h2>
    </div>
  );
}

export default function VerifyEmailFormCard({
  form,
  email,
  loading,
  resendLoading,
  success,
  resendCooldown,
  canSubmit,
  canResend,
  missingEmail,
  onSubmit,
  onResend,
}: VerifyEmailFormCardProps) {
  if (missingEmail) {
    return (
      <div className={formCardClassName}>
        <CardHeader
          eyebrow="Verification"
          title="Verification"
          icon={ShieldCheck}
        />
        <div className="space-y-5 text-center">
          <p className="font-apex-body text-sm text-apex-on-surface-variant">
            Missing email. Please sign up again.
          </p>
          <Button asChild className={cn("w-full", appPrimaryButtonClassName)}>
            <Link to="/signup">Go to Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasEmail = email.trim().length > 0;

  return (
    <div className={formCardClassName}>
      <CardHeader
        eyebrow="Account verification"
        title="Verify your email"
        icon={Mail}
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-busy={loading || undefined}
        >
          <p className="font-apex-body text-sm text-apex-on-surface-variant">
            We sent a verification code to your email.
          </p>
          {hasEmail && (
            <p className="break-all font-apex-body text-sm font-medium text-apex-on-surface">
              {email}
            </p>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>Verification code</label>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={loading}
                    placeholder="Enter code"
                    className={appInputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />

          <FormRootMessage className="text-xs text-apex-error" />
          {success && (
            <p className="font-apex-body text-sm text-apex-success" role="status">
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            aria-busy={loading}
            className={cn("w-full", appPrimaryButtonClassName)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Verifying…
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <Button
            type="button"
            disabled={!canResend}
            onClick={() => void onResend()}
            className={cn("w-full", appOutlineButtonClassName)}
          >
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : resendLoading
                ? "Sending…"
                : "Resend code"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
