import type { UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
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
import type {
  ForgotCodeFormValues,
  ForgotEmailFormValues,
  ForgotResetFormValues,
} from "@/lib/validation/authPages";
import {
  v2InputClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

export type ForgotPasswordStep = "email" | "code" | "reset" | "done";

const formLabelClassName =
  "font-v2-body text-[10px] uppercase text-v2-on-surface-variant";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-6 sm:p-8";

const STEP_META: Record<
  ForgotPasswordStep,
  { eyebrow: string; title: string; icon: typeof Mail }
> = {
  email: { eyebrow: "Account recovery", title: "Forgot password", icon: Mail },
  code: {
    eyebrow: "Verification",
    title: "Check your email",
    icon: ShieldCheck,
  },
  reset: { eyebrow: "New password", title: "Reset password", icon: KeyRound },
  done: { eyebrow: "Complete", title: "Password reset", icon: CheckCircle2 },
};

type ForgotPasswordFormCardV2Props = {
  step: ForgotPasswordStep;
  emailForm: UseFormReturn<WithRootError<ForgotEmailFormValues>>;
  codeForm: UseFormReturn<WithRootError<ForgotCodeFormValues>>;
  resetForm: UseFormReturn<WithRootError<ForgotResetFormValues>>;
  emailDisplay: string;
  loading: boolean;
  success: string | null;
  onEmailSubmit: (email: string) => Promise<void>;
  onCodeSubmit: (code: string) => Promise<void>;
  onResetSubmit: (password: string) => Promise<void>;
  onBackToEmail: () => void;
  onResendCode: () => Promise<void>;
};

function StepHeader({ step }: { step: ForgotPasswordStep }) {
  const { eyebrow, title, icon: Icon } = STEP_META[step];

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

function SuccessMessage({ message }: { message: string }) {
  return (
    <p className="font-v2-body text-sm text-v2-success" role="status">
      {message}
    </p>
  );
}

export default function ForgotPasswordFormCardV2({
  step,
  emailForm,
  codeForm,
  resetForm,
  emailDisplay,
  loading,
  success,
  onEmailSubmit,
  onCodeSubmit,
  onResetSubmit,
  onBackToEmail,
  onResendCode,
}: ForgotPasswordFormCardV2Props) {
  const navigate = useNavigate();

  if (step === "done") {
    return (
      <div className={formCardClassName}>
        <StepHeader step="done" />
        <div className="space-y-5 text-center">
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            Your password has been updated. You can now sign in with your new
            password.
          </p>
          <Button
            type="button"
            onClick={() => navigate("/v2/login")}
            className={cn("w-full", v2PrimaryButtonClassName)}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className={formCardClassName}>
        <StepHeader step="email" />
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(async (values) => {
              await onEmailSubmit(values.email.trim());
            })}
            className="space-y-5"
            aria-busy={loading || undefined}
          >
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              Enter your email for a verification code.
            </p>

            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className={formLabelClassName}>Email</label>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
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
            {success && <SuccessMessage message={success} />}

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={cn("w-full", v2PrimaryButtonClassName)}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Sending code…
                </>
              ) : (
                "Send code"
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className={formCardClassName}>
        <StepHeader step="code" />
        <Form {...codeForm}>
          <form
            onSubmit={codeForm.handleSubmit(async (values) => {
              await onCodeSubmit(values.code.trim());
            })}
            className="space-y-5"
            aria-busy={loading || undefined}
          >
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              We sent a 6‑digit verification code to:
            </p>
            <p className="break-all font-v2-body text-sm font-medium text-v2-on-surface">
              {emailDisplay}
            </p>

            <FormField
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className={formLabelClassName}>
                    Verification code
                  </label>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={loading}
                      placeholder="Enter 6‑digit code"
                      className={v2InputClassName}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-v2-error" />
                </FormItem>
              )}
            />

            <FormRootMessage className="text-xs text-v2-error" />
            {success && <SuccessMessage message={success} />}

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={cn("w-full", v2PrimaryButtonClassName)}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Verifying…
                </>
              ) : (
                "Verify code"
              )}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onBackToEmail}
                className="font-v2-body text-sm text-v2-primary transition-colors hover:text-v2-primary/80"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={() => void onResendCode()}
                className="font-v2-body text-sm text-v2-primary transition-colors hover:text-v2-primary/80"
              >
                Resend code
              </button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className={formCardClassName}>
      <StepHeader step="reset" />
      <Form {...resetForm}>
        <form
          onSubmit={resetForm.handleSubmit(async (values) => {
            await onResetSubmit(values.password);
          })}
          className="space-y-5"
          aria-busy={loading || undefined}
        >
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            Choose a new password for your Apex account.
          </p>

          <FormField
            control={resetForm.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>New password</label>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
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
            control={resetForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>Confirm password</label>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
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
          {success && <SuccessMessage message={success} />}

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={cn("w-full", v2PrimaryButtonClassName)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
