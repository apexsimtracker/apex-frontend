import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_RED } from "@/lib/authUi";

export type AuthPrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

/** Primary CTA for guest auth pages — consistent brand red */
export const AuthPrimaryButton = forwardRef<HTMLButtonElement, AuthPrimaryButtonProps>(
  function AuthPrimaryButton(
    { className, style, type = "button", loading = false, disabled, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex w-full items-center justify-center rounded-md px-3 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50",
          className
        )}
        style={{ backgroundColor: PRIMARY_RED, ...style }}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 shrink-0 animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
