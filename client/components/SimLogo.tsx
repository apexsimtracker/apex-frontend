import { getSimLogoSrc } from "@/lib/sim";
import { cn } from "@/lib/utils";

type SimLogoProps = {
  sim: string | null | undefined;
  className?: string;
};

/**
 * Brand-style sim logo from static `/sims/*.svg` assets. Decorative when the sim name is shown beside it.
 */
export function SimLogo({ sim, className }: SimLogoProps) {
  const src = getSimLogoSrc(sim);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      width={120}
      height={32}
      loading="lazy"
      decoding="async"
      className={cn(
        "h-7 w-auto max-w-[140px] object-contain object-left shrink-0 select-none",
        className
      )}
    />
  );
}
