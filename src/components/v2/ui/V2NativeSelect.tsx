import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { v2ManualSelectClassName } from "./v2ButtonClasses";

type V2NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const V2NativeSelect = forwardRef<HTMLSelectElement, V2NativeSelectProps>(
  function V2NativeSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(v2ManualSelectClassName, className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-v2-on-surface-variant"
          aria-hidden
        />
      </div>
    );
  },
);

export default V2NativeSelect;
