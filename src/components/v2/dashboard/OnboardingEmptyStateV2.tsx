import { useNavigate } from "react-router-dom";
import { Upload, Cpu, Zap, PenLine } from "lucide-react";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";

export default function OnboardingEmptyStateV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = useIsProUser();

  if (!user) return null;

  return (
    <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-8 sm:p-10">
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-v2-headline text-2xl font-semibold text-v2-on-surface">
          Welcome to Apex
        </h2>
        <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
          Track your sim racing performance automatically or upload sessions
          manually.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => navigate("/v2/upload")}
            className={`${v2PrimaryButtonClassName} h-11 w-full`}
          >
            <Upload className="mr-2 size-4" />
            Upload a Session
          </button>

          <button
            type="button"
            onClick={() => navigate("/v2/manual")}
            className={`${v2OutlineButtonClassName} h-11 w-full`}
          >
            <PenLine className="mr-2 size-4" />
            Log Manual Activity
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-v2-outline-variant/15" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-v2-surface-container-low px-3 text-v2-on-surface-variant">
                or
              </span>
            </div>
          </div>

          {isPro ? (
            <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-high/40 p-5">
              <div className="flex items-center justify-center gap-2 text-v2-on-surface">
                <Cpu className="size-4" />
                <span className="font-v2-body text-sm font-medium">
                  Use the Apex Agent for automatic uploads.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/v2/agent")}
                className={`${v2OutlineButtonClassName} mt-4 w-full`}
              >
                Open Agent Page
              </button>
            </div>
          ) : (
            <div className="rounded-v2-lg border border-v2-primary/20 bg-v2-primary/5 p-5">
              <div className="flex items-center justify-center gap-2 text-v2-primary">
                <Zap className="size-4" />
                <span className="font-v2-body text-sm font-medium">
                  Automatic uploads are available with Apex Pro.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className={`${v2PrimaryButtonClassName} mt-4 w-full`}
              >
                Learn About Pro
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 font-v2-body text-xs text-v2-on-surface-variant/70">
          Your sessions, laps, and performance insights will appear here.
        </p>
      </div>
    </div>
  );
}
