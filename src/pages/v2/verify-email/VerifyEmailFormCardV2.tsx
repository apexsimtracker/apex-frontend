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
  v2InputClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

const formLabelClassName =
  "font-v2-body text-[10px] uppercase text-v2-on-surface-variant";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-6 sm:p-8";

type VerifyEmailFormCardV2Props = {
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
        className="mb-4 flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary lg:hidden"
        aria-hidden
      >
        <Icon className="size-5" />
      </div>
      <p className={cn(sectionEyebrowClassName, "lg:hidden")}>{eyebrow}</p>
      <h2 className="mt-2 font-v2-headline text-lg font-semibold text-v2-on-surface lg:mt-0">
        {title}
      </h2>
    </div>
  );
}

export default function VerifyEmailFormCardV2({
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
}: VerifyEmailFormCardV2Props) {
  if (missingEmail) {
    return (
      <div className={formCardClassName}>
        <CardHeader
          eyebrow="Verification"
          title="Verification"
          icon={ShieldCheck}
        />
        <div className="space-y-5 text-center">
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            Missing email. Please sign up again.
          </p>
          <Button asChild className={cn("w-full", v2PrimaryButtonClassName)}>
            <Link to="/v2/signup">Go to Sign up</Link>
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
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            We sent a verification code to your email.
          </p>
          {hasEmail && (
            <p className="break-all font-v2-body text-sm font-medium text-v2-on-surface">
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
                    className={v2InputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormRootMessage className="text-xs text-v2-error" />
          {success && (
            <p className="font-v2-body text-sm text-v2-success" role="status">
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            aria-busy={loading}
            className={cn("w-full", v2PrimaryButtonClassName)}
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
            className={cn("w-full", v2OutlineButtonClassName)}
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
