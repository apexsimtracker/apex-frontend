import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { PRIMARY_RED } from "@/lib/authUi";

export type AuthPrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Primary CTA for guest auth pages — consistent brand red */
export const AuthPrimaryButton = forwardRef<HTMLButtonElement, AuthPrimaryButtonProps>(
  function AuthPrimaryButton({ className, style, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-md px-3 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50",
          className
        )}
        style={{ backgroundColor: PRIMARY_RED, ...style }}
        {...props}
      />
    );
  }
);
