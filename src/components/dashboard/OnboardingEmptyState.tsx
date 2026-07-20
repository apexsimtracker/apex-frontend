import { useNavigate } from "react-router-dom";
import { Upload, Cpu, Zap, PenLine } from "lucide-react";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";

import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";

export default function OnboardingEmptyState() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = useIsProUser();

  if (!user) return null;

  return (
    <div className="rounded-apex-lg border border-apex-outline-variant/10 bg-apex-surface-container-low p-8 sm:p-10">
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-apex-headline text-2xl font-semibold text-apex-on-surface">
          Welcome to Apex
        </h2>
        <p className="mt-2 font-apex-body text-sm text-apex-on-surface-variant">
          Track your sim racing performance automatically or upload sessions
          manually.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => navigate("/upload")}
            className={`${appPrimaryButtonClassName} h-11 w-full`}
          >
            <Upload className="mr-2 size-4" />
            Upload a Session
          </button>

          <button
            type="button"
            onClick={() => navigate("/manual")}
            className={`${appOutlineButtonClassName} h-11 w-full`}
          >
            <PenLine className="mr-2 size-4" />
            Log Manual Activity
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-apex-outline-variant/15" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-apex-surface-container-low px-3 text-apex-on-surface-variant">
                or
              </span>
            </div>
          </div>

          {isPro ? (
            <div className="rounded-apex-lg border border-apex-outline-variant/10 bg-apex-surface-container-high/40 p-5">
              <div className="flex items-center justify-center gap-2 text-apex-on-surface">
                <Cpu className="size-4" />
                <span className="font-apex-body text-sm font-medium">
                  Use the Apex Agent for automatic uploads.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/agent")}
                className={`${appOutlineButtonClassName} mt-4 w-full`}
              >
                Open Agent Page
              </button>
            </div>
          ) : (
            <div className="rounded-apex-lg border border-apex-primary/20 bg-apex-primary/5 p-5">
              <div className="flex items-center justify-center gap-2 text-apex-primary">
                <Zap className="size-4" />
                <span className="font-apex-body text-sm font-medium">
                  Automatic uploads are available with Apex Pro.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className={`${appPrimaryButtonClassName} mt-4 w-full`}
              >
                Learn About Pro
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 font-apex-body text-xs text-apex-on-surface-variant/70">
          Your sessions, laps, and performance insights will appear here.
        </p>
      </div>
    </div>
  );
}
