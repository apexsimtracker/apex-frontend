import { cn } from "@/lib/utils";

type V2SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  "aria-label"?: string;
};

export function V2Switch({
  checked,
  disabled = false,
  onCheckedChange,
  id,
  "aria-label": ariaLabel,
}: V2SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative flex h-6 w-12 shrink-0 items-center rounded-full px-1 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70",
        checked ? "justify-end bg-[#eb0000]" : "justify-start bg-v2-surface-container-highest",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full transition-transform",
          checked ? "bg-white" : "bg-v2-on-surface-variant",
        )}
      />
    </button>
  );
}
