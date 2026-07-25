import { cn } from "@/lib/utils";

type SessionCaptionProps = {
  caption: string | null | undefined;
  className?: string;
};

/**
 * Public session caption excerpt. Renders nothing when empty.
 */
export default function SessionCaption({
  caption,
  className,
}: SessionCaptionProps) {
  const text = caption?.trim();
  if (!text) return null;

  return (
    <blockquote
      className={cn(
        "rounded-lg border-l-2 border-apex-primary bg-apex-surface-container px-3 py-2.5",
        className,
      )}
    >
      <p className="font-apex-body text-sm italic leading-relaxed text-apex-on-surface">
        &ldquo;{text}&rdquo;
      </p>
    </blockquote>
  );
}
