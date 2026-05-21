import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  children: ReactNode;
  /** Default narrow column; use `md` for wider multi-step copy */
  maxWidth?: "sm" | "md";
  className?: string;
};

export function AuthPageShell({ children, maxWidth = "sm", className }: AuthPageShellProps) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center p-4", className)}>
      <div className={cn("w-full", maxWidth === "md" ? "max-w-md" : "max-w-sm")}>{children}</div>
    </div>
  );
}
