import type { ReactNode } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant";

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
        "flex size-9 shrink-0 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function ForgotPasswordWelcomePanel() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Account recovery</p>
      <h1 className="mt-3 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface">
        Reset password.
        <span className="block text-apex-primary sm:inline sm:before:content-['\00a0']">
          Get back on track.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        Enter your email for a verification code.
      </p>

      <ul className="mt-8 space-y-4">
        {FEATURES.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex gap-4">
            <IconChip>
              <Icon className="size-4" />
            </IconChip>
            <div className="min-w-0 pt-0.5">
              <p className="font-apex-headline text-sm font-semibold text-apex-on-surface">
                {label}
              </p>
              <p className="mt-0.5 font-apex-body text-sm text-apex-on-surface-variant">
                {detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
