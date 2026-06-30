import { getSessionTypeTagStyle } from "@/lib/sessionKind";

interface SessionTypeTagProps {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Colored pill indicating session kind (Race, Qualifying, Practice, Warmup).
 */
export default function SessionTypeTag({
  sessionType,
  manualSessionKind,
  size = "sm",
  className = "",
}: SessionTypeTagProps) {
  const style = getSessionTypeTagStyle({ sessionType, manualSessionKind });

  const sizeClasses =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded border font-semibold uppercase tracking-wider ${sizeClasses} ${className}`}
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: `${style.color}33`,
      }}
      aria-label={`Session type: ${style.label}`}
    >
      {style.label}
    </span>
  );
}
