import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Download, Lock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsProUser } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/auth/token";

const SUPPORTED_SIMS = [
  { name: "iRacing", status: "Supported" },
  { name: "F1 25", status: "Supported" },
];

const DOWNLOAD_ENDPOINT = `${API_BASE}/api/agent/download`;

export default function Agent() {
  const navigate = useNavigate();
  const isPro = useIsProUser();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(DOWNLOAD_ENDPOINT, {
        method: "HEAD",
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (response.ok || response.status === 302) {
        window.location.href = DOWNLOAD_ENDPOINT;
      } else if (response.status === 403) {
        toast({
          title: "Apex Pro Required",
          description: "Apex Pro required to download the agent.",
          variant: "destructive",
        });
        navigate("/upgrade");
      } else {
        toast({
          title: "Download failed",
          description: "Unable to start download. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Download failed",
        description: "Unable to start download. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <Cpu className="h-7 w-7 text-white/70" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Apex Agent</h1>
            <p className="mt-2 text-white/60">
              Automatic telemetry uploads for supported simulators.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-sm font-medium text-white/80 mb-2">
                What it does
              </h2>
              <p className="text-sm text-white/50">
                The Apex Agent runs locally on your computer and automatically
                detects when you complete a session in supported simulators. It
                uploads your telemetry data to Apex so you can track your
                progress without any manual work.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-white/80 mb-3">
                Supported Simulators
              </h2>
              <div className="space-y-2">
                {SUPPORTED_SIMS.map((sim) => (
                  <div
                    key={sim.name}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-2.5"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-white/80">{sim.name}</span>
                    <span className="ml-auto text-xs text-white/40">
                      {sim.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-white/50">
                <span className="text-white/70">Status:</span> Runs locally and
                uploads sessions automatically when you finish driving.
              </p>
            </div>
          </div>

          <div className="mt-8">
            {isPro ? (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing download…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Apex Agent
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <Lock className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Apex Pro Required
                  </h3>
                  <p className="mt-1 text-xs text-white/50">
                    Automatic uploads are available with Apex Pro.
                  </p>
                  <Button
                    onClick={() => navigate("/upgrade")}
                    className="mt-4 bg-amber-500 text-black hover:bg-amber-400"
                    size="sm"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
