import { cn } from "@/lib/utils";

type AppSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  "aria-label"?: string;
};

export function AppSwitch({
  checked,
  disabled = false,
  onCheckedChange,
  id,
  "aria-label": ariaLabel,
}: AppSwitchProps) {
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/70",
        checked
          ? "justify-end bg-[#eb0000]"
          : "justify-start bg-apex-surface-container-highest",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full transition-transform",
          checked ? "bg-white" : "bg-apex-on-surface-variant",
        )}
      />
    </button>
  );
}
