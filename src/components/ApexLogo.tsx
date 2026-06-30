import { useId, useState, type CSSProperties } from "react";
import {
  LOADING_LOGO_HEIGHT_PX,
  LOADING_LOGO_MAX_WIDTH_PX,
} from "@/lib/loadingTips";
import { cn } from "@/lib/utils";

type ApexLogoProps = {
  className?: string;
  style?: CSSProperties;
};

/** Inline SVG fallback when `/logo.png` is unavailable. */
export function ApexLogo({ className, style }: ApexLogoProps) {
  const uid = useId().replace(/:/g, "");
  const swooshId = `apex-swoosh-${uid}`;
  const swoosh2Id = `apex-swoosh2-${uid}`;
  const glowId = `apex-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 140 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Apex Logo"
    >
      <path
        d="M12 40L24 8L36 40"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 36 Q20 20 28 14 Q32 12 34 10"
        fill="none"
        stroke={`url(#${swooshId})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 34 Q22 22 30 16"
        fill="none"
        stroke={`url(#${swoosh2Id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="33" cy="11" r="3" fill={`url(#${glowId})`} />
      <circle cx="33" cy="11" r="1.5" fill="#ff6b35" />
      <path
        d="M33 11 L28 16"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id={swooshId}
          x1="14"
          y1="36"
          x2="34"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b91c1c" />
          <stop offset="0.5" stopColor="#dc2626" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient
          id={swoosh2Id}
          x1="16"
          y1="34"
          x2="30"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dc2626" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="33"
          cy="11"
          r="3"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff8c5a" />
          <stop offset="0.6" stopColor="#ea580c" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <text
        x="48"
        y="32"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="0.08em"
      >
        APEX
      </text>
    </svg>
  );
}

type ApexLogoImageProps = {
  className?: string;
  imgClassName?: string;
  /** Inline height/max-width so the logo is correct before Tailwind CSS loads. */
  fixedDisplaySize?: boolean;
};

/** PNG logo with SVG fallback on load error. */
export function ApexLogoImage({
  className,
  imgClassName,
  fixedDisplaySize = false,
}: ApexLogoImageProps) {
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const fixedDisplayStyle = fixedDisplaySize
    ? {
        display: "block" as const,
        height: LOADING_LOGO_HEIGHT_PX,
        width: LOADING_LOGO_MAX_WIDTH_PX,
        maxWidth: LOADING_LOGO_MAX_WIDTH_PX,
        aspectRatio: "112 / 40",
        objectFit: "contain" as const,
      }
    : undefined;

  if (logoImgFailed) {
    return <ApexLogo className={className} style={fixedDisplayStyle} />;
  }

  return (
    <img
      src="/logo.png?v=4"
      alt="Apex Logo"
      width={112}
      height={40}
      style={fixedDisplayStyle}
      className={cn(
        fixedDisplaySize
          ? "object-contain object-center"
          : "h-9 w-auto max-w-[112px] object-contain object-center sm:h-10",
        imgClassName,
        className,
      )}
      onError={() => setLogoImgFailed(true)}
    />
  );
}
