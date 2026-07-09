import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type V2RadioGroupProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function V2RadioGroup({
  value: _value,
  onValueChange: _onValueChange,
  disabled = false,
  children,
  className,
}: V2RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn("space-y-3", className)}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
}

type V2RadioItemProps = {
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
  id: string;
  children: ReactNode;
};

export function V2RadioItem({
  value,
  checked,
  onSelect,
  disabled = false,
  id,
  children,
}: V2RadioItemProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        id={id}
        role="radio"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onSelect(value)}
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70",
          checked ? "border-v2-primary" : "border-v2-outline-variant",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {checked ? (
          <span className="size-2 rounded-full bg-v2-primary" />
        ) : null}
      </button>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function V2RadioGroupControlled({
  value,
  onValueChange,
  disabled = false,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  options: { value: string; id: string; label: ReactNode }[];
}) {
  return (
    <V2RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      {options.map((opt) => (
        <V2RadioItem
          key={opt.value}
          id={opt.id}
          value={opt.value}
          checked={value === opt.value}
          onSelect={onValueChange}
          disabled={disabled}
        >
          {opt.label}
        </V2RadioItem>
      ))}
    </V2RadioGroup>
  );
}
