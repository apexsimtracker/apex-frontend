import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { appManualSelectClassName } from "./appButtonClasses";

type AppNativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const AppNativeSelect = forwardRef<HTMLSelectElement, AppNativeSelectProps>(
  function AppNativeSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(appManualSelectClassName, "cursor-pointer", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-apex-on-surface-variant"
          aria-hidden
        />
      </div>
    );
  },
);

export default AppNativeSelect;
