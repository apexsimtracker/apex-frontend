import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export interface SkeletonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number;
  width?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

function SkeletonBlock({
  height,
  width,
  rounded = "md",
  className,
  style,
  ...props
}: SkeletonBlockProps) {
  const roundedClass =
    rounded === "none"
      ? "rounded-none"
      : rounded === "sm"
        ? "rounded-sm"
        : rounded === "lg"
          ? "rounded-lg"
          : rounded === "full"
            ? "rounded-full"
            : "rounded-md";
  return (
    <div
      className={cn(
        "animate-pulse bg-white/10",
        roundedClass,
        className
      )}
      style={{
        ...style,
        height: height != null ? (typeof height === "number" ? `${height}px` : height) : undefined,
        width: width != null ? (typeof width === "number" ? `${width}px` : width) : undefined,
      }}
      {...props}
    />
  );
}

export { Skeleton, SkeletonBlock };
