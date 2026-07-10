import { cn } from "@/lib/utils";

export const v2PrimaryButtonClassName = cn(
  "rounded-v2-sm px-8 py-2.5 font-v2-headline text-sm font-bold uppercase tracking-widest",
  "bg-v2-primary text-white hover:bg-v2-primary/90",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const v2SecondaryButtonClassName = cn(
  "rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container-highest",
  "font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-on-surface",
  "hover:bg-v2-surface-container transition-colors",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const v2OutlineButtonClassName = cn(
  "rounded-v2-sm border border-v2-outline-variant/20 text-v2-on-surface",
  "hover:bg-v2-surface-container transition-colors",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const v2DestructiveButtonClassName = cn(
  "rounded-v2-sm bg-v2-error font-v2-body text-sm font-bold text-white",
  "hover:bg-v2-error/90 transition-colors",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const v2InputClassName =
  "w-full rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container-highest px-3 py-2 text-sm text-v2-on-surface shadow-none placeholder:text-v2-on-surface-variant/50 focus:border-v2-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50";

export const v2SelectClassName = cn(
  "h-12 w-full appearance-none rounded-v2-sm",
  "border border-v2-outline-variant/20 bg-v2-surface-container-highest",
  "px-4 pr-10 font-v2-headline text-sm text-v2-on-surface",
  "focus:border-v2-primary focus:outline-none focus:ring-0",
  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/** Loveable manual-entry field radius (8px) — not project `rounded-lg` (16px from --radius). */
const LOVEABLE_FIELD_RADIUS = "rounded-[0.5rem]";

export const v2ManualInputClassName = cn(
  "h-12 w-full",
  LOVEABLE_FIELD_RADIUS,
  "border border-v2-outline-variant/40 bg-v2-surface-container",
  "px-4 font-v2-headline text-sm text-v2-on-surface",
  "placeholder:text-v2-on-surface-variant/50",
  "focus:border-v2-primary focus:outline-none focus:ring-0",
  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const v2ManualSelectClassName = cn(
  v2ManualInputClassName,
  "appearance-none pr-10",
);

export const v2ManualTextareaClassName = cn(
  "w-full min-h-[7rem] resize-none p-4",
  LOVEABLE_FIELD_RADIUS,
  "border border-v2-outline-variant/40 bg-v2-surface-container",
  "text-sm text-v2-on-surface",
  "placeholder:text-v2-on-surface-variant/50",
  "focus:border-v2-primary focus:outline-none focus:ring-0",
  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  "disabled:opacity-50",
);

export const v2AccountInputClassName =
  "w-full rounded-v2-sm border border-transparent bg-v2-surface-container-highest px-3 py-1 font-v2-headline text-lg font-bold text-v2-on-surface shadow-none placeholder:text-v2-on-surface-variant/50 focus:border-v2-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 sm:text-xl";

export const v2AccountFieldValueClassName =
  "font-v2-headline text-sm font-bold text-v2-on-surface break-words";

export const v2DropdownContentClassName = cn(
  "!rounded-md !border-[#484847]/65 !bg-[#0e0e0e] text-white shadow-md",
);

/** Default item hover — light red highlight (no bold/icon stroke). */
export const v2DropdownItemClassName = cn(
  "cursor-pointer text-white/90",
  "focus:!bg-[#E10600]/15 focus:text-white",
  "data-[highlighted]:!bg-[#E10600]/15 data-[highlighted]:!font-normal data-[highlighted]:text-white",
);

export const v2ProfileDropdownContentClassName = cn(
  v2DropdownContentClassName,
  "!w-64",
);

/** Danger sign-out — red text, distinct hover surface. */
export const v2DropdownDangerItemClassName = cn(
  "cursor-pointer text-[#ff6e84]",
  "focus:!bg-[#a70138]/20 focus:text-[#ff6e84]",
  "data-[highlighted]:!bg-[#a70138]/20 data-[highlighted]:!font-normal data-[highlighted]:text-[#ff6e84]",
);

export const v2DropdownSeparatorClassName = "bg-[#484847]/20";

export const v2DropdownEmailClassName =
  "truncate text-xs text-v2-on-surface-variant";

/** Loveable tertiary accent — download icons, highlights */
export const v2TertiaryIconClassName = "text-[#8ff5ff]";

/** Loveable destructive account-action surface */
export const v2DangerCardClassName = cn(
  "rounded-v2-lg border border-[#ff6e84]/20 bg-[#a70138]/10 p-6",
  "transition-colors hover:bg-[#a70138]/20",
);
