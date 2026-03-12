import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPasswordWithCode,
  ApiError,
} from "@/lib/api";

type Step = "email" | "code" | "reset" | "done";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!trimmedEmail) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setSuccess("We sent a verification code to your email.");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!trimmedEmail) {
      setError("Email is missing. Go back and enter it again.");
      return;
    }
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setError("Enter the 6‑digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordResetCode(trimmedEmail, trimmedCode);
      setStep("reset");
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESET_CODE_INVALID") {
        setError("That code is invalid. Check the email and try again.");
      } else if (err instanceof ApiError && err.code === "RESET_CODE_EXPIRED") {
        setError("That code has expired. Request a new one.");
      } else {
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!trimmedEmail) {
      setError("Email is missing. Go back and enter it again.");
      return;
    }
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Reset code is missing. Go back and enter it again.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithCode(trimmedEmail, trimmedCode, password);
      setSuccess("Your password has been reset. You can now sign in.");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  function renderEmailStep() {
    return (
      <form onSubmit={handleRequestReset} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a verification code to reset your password.
        </p>

        <div>
          <label htmlFor="fp-email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-500" role="alert">
            {error}
          </div>
        )}
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
    );
  }

  function renderCodeStep() {
    return (
      <form onSubmit={handleVerifyCode} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6‑digit verification code to:
        </p>
        <p className="text-sm font-medium text-foreground break-all">{trimmedEmail}</p>

        <div>
          <label htmlFor="fp-code" className="block text-sm font-medium mb-1">
            Verification code
          </label>
          <input
            id="fp-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            placeholder="Enter 6‑digit code"
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-500" role="alert">
            {error}
          </div>
        )}
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
            onClick={() => setStep("email")}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!trimmedEmail) {
                setError("Email is missing. Go back and enter it again.");
                return;
              }
              setError(null);
              setSuccess(null);
              setLoading(true);
              try {
                await requestPasswordReset(trimmedEmail);
                setSuccess("We sent a new verification code to your email.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to resend code.");
              } finally {
                setLoading(false);
              }
            }}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  function renderResetStep() {
    return (
      <form onSubmit={handleResetPassword} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your Apex account.
        </p>

        <div>
          <label htmlFor="fp-password" className="block text-sm font-medium mb-1">
            New password
          </label>
          <input
            id="fp-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="fp-password-confirm" className="block text-sm font-medium mb-1">
            Confirm password
          </label>
          <input
            id="fp-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-500" role="alert">
            {error}
          </div>
        )}
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
    );
  }

  function renderDoneStep() {
    return (
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

  let content: React.ReactNode;
  if (step === "email") content = renderEmailStep();
  else if (step === "code") content = renderCodeStep();
  else if (step === "reset") content = renderResetStep();
  else content = renderDoneStep();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {content}
    </div>
  );
}

