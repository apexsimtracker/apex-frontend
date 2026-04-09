import { useState, useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPasswordWithCode,
  ApiError,
} from "@/lib/api";
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
  forgotEmailFormSchema,
  forgotCodeFormSchema,
  forgotResetFormSchema,
  type ForgotEmailFormValues,
  type ForgotCodeFormValues,
  type ForgotResetFormValues,
} from "@/lib/validation/authPages";

type Step = "email" | "code" | "reset" | "done";

const inputClass = "w-full px-3 py-2 border rounded-md bg-transparent";

function EmailStepForm({
  form,
  loading,
  success,
  onSubmit,
}: {
  form: UseFormReturn<WithRootError<ForgotEmailFormValues>>;
  loading: boolean;
  success: string | null;
  onSubmit: (email: string) => Promise<void>;
}) {
  const navigate = useNavigate();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values.email.trim());
        })}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-foreground">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a verification code to reset your password.
        </p>

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

        <FormRootMessage />
        {success && (
          <div className="text-sm text-green-500" role="status">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-md text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "rgb(240, 28, 28)" }}
        >
          {loading ? "Sending code…" : "Send code"}
        </button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="underline hover:text-foreground"
          >
            Back to sign in
          </button>
        </p>
      </form>
    </Form>
  );
}

function CodeStepForm({
  form,
  emailDisplay,
  loading,
  success,
  onSubmit,
  onBack,
  onResend,
}: {
  form: UseFormReturn<WithRootError<ForgotCodeFormValues>>;
  emailDisplay: string;
  loading: boolean;
  success: string | null;
  onSubmit: (code: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
}) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values.code.trim());
        })}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">We sent a 6‑digit verification code to:</p>
        <p className="text-sm font-medium text-foreground break-all">{emailDisplay}</p>

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  disabled={loading}
                  placeholder="Enter 6‑digit code"
                  className={inputClass}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-md text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "rgb(240, 28, 28)" }}
        >
          {loading ? "Verifying…" : "Verify code"}
        </button>

        <div className="flex items-center justify-between text-sm pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={() => void onResend()}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Resend code
          </button>
        </div>
      </form>
    </Form>
  );
}

function ResetStepForm({
  form,
  loading,
  success,
  onSubmit,
}: {
  form: UseFormReturn<WithRootError<ForgotResetFormValues>>;
  loading: boolean;
  success: string | null;
  onSubmit: (password: string) => Promise<void>;
}) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values.password);
        })}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-foreground">Reset password</h1>
        <p className="text-sm text-muted-foreground">Choose a new password for your Apex account.</p>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
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
        {success && (
          <div className="text-sm text-green-500" role="status">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-md text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "rgb(240, 28, 28)" }}
        >
          {loading ? "Saving…" : "Reset password"}
        </button>
      </form>
    </Form>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const emailForm = useForm<WithRootError<ForgotEmailFormValues>>({
    resolver: zodResolver(forgotEmailFormSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<WithRootError<ForgotCodeFormValues>>({
    resolver: zodResolver(forgotCodeFormSchema),
    defaultValues: { code: "" },
  });
  const resetForm = useForm<WithRootError<ForgotResetFormValues>>({
    resolver: zodResolver(forgotResetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (step === "email") {
      emailForm.reset({ email });
    }
  }, [step, email, emailForm.reset]);

  useEffect(() => {
    if (step === "code") {
      codeForm.reset({ code });
    }
  }, [step, code, codeForm.reset]);

  useEffect(() => {
    if (step === "reset") {
      resetForm.reset({ password: "", confirmPassword: "" });
    }
  }, [step, resetForm.reset]);

  const trimmedEmail = email.trim();

  async function handleEmailSubmit(trimmed: string) {
    emailForm.clearErrors("root");
    setSuccess(null);
    setLoading(true);
    try {
      await requestPasswordReset(trimmed);
      setEmail(trimmed);
      setSuccess("We sent a verification code to your email.");
      setStep("code");
    } catch (err) {
      emailForm.setError("root", {
        type: "server",
        message: err instanceof Error ? err.message : "Failed to request reset.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(trimmedCode: string) {
    codeForm.clearErrors("root");
    setSuccess(null);
    if (!trimmedEmail) {
      codeForm.setError("root", {
        type: "server",
        message: "Email is missing. Go back and enter it again.",
      });
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordResetCode(trimmedEmail, trimmedCode);
      setCode(trimmedCode);
      setStep("reset");
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESET_CODE_INVALID") {
        codeForm.setError("root", {
          type: "server",
          message: "That code is invalid. Check the email and try again.",
        });
      } else if (err instanceof ApiError && err.code === "RESET_CODE_EXPIRED") {
        codeForm.setError("root", {
          type: "server",
          message: "That code has expired. Request a new one.",
        });
      } else {
        codeForm.setError("root", {
          type: "server",
          message: err instanceof Error ? err.message : "Verification failed.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(password: string) {
    resetForm.clearErrors("root");
    setSuccess(null);
    if (!trimmedEmail) {
      resetForm.setError("root", {
        type: "server",
        message: "Email is missing. Go back and enter it again.",
      });
      return;
    }
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      resetForm.setError("root", {
        type: "server",
        message: "Reset code is missing. Go back and enter it again.",
      });
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithCode(trimmedEmail, trimmedCode, password);
      setSuccess("Your password has been reset. You can now sign in.");
      setStep("done");
    } catch (err) {
      resetForm.setError("root", {
        type: "server",
        message: err instanceof Error ? err.message : "Failed to reset password.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!trimmedEmail) {
      codeForm.setError("root", {
        type: "server",
        message: "Email is missing. Go back and enter it again.",
      });
      return;
    }
    codeForm.clearErrors("root");
    setSuccess(null);
    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setSuccess("We sent a new verification code to your email.");
    } catch (err) {
      codeForm.setError("root", {
        type: "server",
        message: err instanceof Error ? err.message : "Failed to resend code.",
      });
    } finally {
      setLoading(false);
    }
  }

  let content: React.ReactNode;
  if (step === "email") {
    content = (
      <EmailStepForm
        form={emailForm}
        loading={loading}
        success={success}
        onSubmit={handleEmailSubmit}
      />
    );
  } else if (step === "code") {
    content = (
      <CodeStepForm
        form={codeForm}
        emailDisplay={trimmedEmail}
        loading={loading}
        success={success}
        onSubmit={handleCodeSubmit}
        onBack={() => {
          setStep("email");
          codeForm.clearErrors("root");
          emailForm.clearErrors("root");
          setSuccess(null);
        }}
        onResend={handleResendCode}
      />
    );
  } else if (step === "reset") {
    content = (
      <ResetStepForm
        form={resetForm}
        loading={loading}
        success={success}
        onSubmit={handleResetSubmit}
      />
    );
  } else {
    content = (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Password reset</h1>
        <p className="text-sm text-muted-foreground">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full px-3 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "rgb(240, 28, 28)" }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center p-4">{content}</div>;
}
