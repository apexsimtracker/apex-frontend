import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { iconChipClassName } from "./publicHomeV2Shared";

export function IconChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(iconChipClassName, className)} aria-hidden>
      {children}
    </div>
  );
}
