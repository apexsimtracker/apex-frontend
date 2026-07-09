import type { ReactNode } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const FEATURES = [
  {
    icon: Mail,
    label: "Check your inbox",
    detail: "We send a 6-digit verification code to your email.",
  },
  {
    icon: ShieldCheck,
    label: "Secure verification",
    detail: "Confirm your identity before setting a new password.",
  },
  {
    icon: KeyRound,
    label: "Choose a new password",
    detail: "Pick a strong password and get back on track.",
  },
] as const;

function IconChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function ForgotPasswordWelcomePanelV2() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Account recovery</p>
      <h1 className="mt-3 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
        Reset password.
        <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
          Get back on track.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Enter your email for a verification code.
      </p>

      <ul className="mt-8 space-y-4">
        {FEATURES.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex gap-4">
            <IconChip>
              <Icon className="size-4" />
            </IconChip>
            <div className="min-w-0 pt-0.5">
              <p className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                {label}
              </p>
              <p className="mt-0.5 font-v2-body text-sm text-v2-on-surface-variant">
                {detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
