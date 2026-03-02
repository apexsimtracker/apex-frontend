import { useNavigate } from "react-router-dom";
import { Upload, Cpu, Zap, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";

export default function OnboardingEmptyState() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = useIsProUser();

  if (!user) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 sm:p-10">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold text-white">Welcome to Apex</h2>
        <p className="mt-2 text-white/60">
          Track your sim racing performance automatically or upload sessions
          manually.
        </p>

        <div className="mt-8 space-y-4">
          <Button
            onClick={() => navigate("/upload")}
            className="w-full bg-white text-black hover:bg-white/90 h-11"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload a Session
          </Button>

          <Button
            onClick={() => navigate("/manual")}
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11"
            size="lg"
          >
            <PenLine className="h-4 w-4 mr-2" />
            Log Manual Activity
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-white/40">or</span>
            </div>
          </div>

          {isPro ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-center gap-2 text-white/80">
                <Cpu className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Use the Apex Agent for automatic uploads.
                </span>
              </div>
              <Button
                onClick={() => navigate("/agent")}
                variant="outline"
                className="mt-4 w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Open Agent Page
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-center gap-2 text-amber-400/90">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Automatic uploads are available with Apex Pro.
                </span>
              </div>
              <Button
                onClick={() => navigate("/upgrade")}
                className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400"
              >
                Learn About Pro
              </Button>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-white/40">
          Your sessions, laps, and performance insights will appear here.
        </p>
      </div>
    </div>
  );
}
