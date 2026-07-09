import type { ReactNode } from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const FEATURES = [
  {
    icon: Mail,
    label: "Check your inbox",
    detail: "We sent a verification code to your email address.",
  },
  {
    icon: ShieldCheck,
    label: "Confirm your account",
    detail: "Enter the code to verify you own this email.",
  },
  {
    icon: CheckCircle2,
    label: "Start racing",
    detail: "Once verified, sign in and join the community.",
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

export default function VerifyEmailWelcomePanelV2() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Account verification</p>
      <h1 className="mt-3 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
        Verify your email.
        <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
          Almost there.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        We sent a verification code to your email.
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
