import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Apple,
  Cpu,
  Download,
  Lock,
  CheckCircle,
  Loader2,
  Monitor,
  Radio,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { downloadAgentBinary } from "@/lib/api/agentDownload";
import { ApiError, isProRequiredError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import {
  AGENT_DOWNLOAD_FILENAMES,
  AGENT_PLATFORM_LABELS,
  type AgentOs,
  useDetectedAgentOs,
} from "@/hooks/useDetectedAgentOs";

const AGENT_PATH = "/agent";
const agentTitle = `Apex Agent | ${COMPANY_NAME}`;
const agentDescription = `Download the ${COMPANY_NAME} Agent for macOS, Windows, and Linux — a background service that captures sim telemetry and uploads sessions automatically with Apex Pro.`;

const ALL_AGENT_OSES: AgentOs[] = ["macos", "windows", "linux"];

const SUPPORTED_SIMS: Array<{
  name: string;
  icon: typeof Radio;
  support: Record<AgentOs, boolean>;
  detail: Record<AgentOs, string>;
}> = [
  {
    name: "F1 25",
    icon: Radio,
    support: {
      macos: true,
      windows: true,
      linux: true,
    },
    detail: {
      macos: "Captures live UDP telemetry streams in the background.",
      windows: "Captures live UDP telemetry streams in the background.",
      linux: "Captures live UDP telemetry streams in the background.",
    },
  },
  {
    name: "iRacing",
    icon: FileText,
    support: {
      macos: false,
      windows: true,
      linux: false,
    },
    detail: {
      macos: "Automatic iRacing session log capture is currently Windows-only.",
      windows: "Watches and uploads .ibt session log files when disk telemetry is enabled.",
      linux: "Automatic iRacing session log capture is not currently available on Linux.",
    },
  },
  {
    name: "Le Mans Ultimate",
    icon: Cpu,
    support: {
      macos: false,
      windows: true,
      linux: false,
    },
    detail: {
      macos: "LMU telemetry recording support is currently Windows-only.",
      windows: "Watches telemetry recordings and uploads completed LMU sessions automatically.",
      linux: "LMU telemetry auto-discovery is not currently available on Linux.",
    },
  },
];

function platformBadge(os: AgentOs) {
  if (os === "macos") {
    return (
      <>
        <Apple className="size-3.5" />
        macOS 12+
      </>
    );
  }
  if (os === "linux") {
    return (
      <>
        <Monitor className="size-3.5" />
        Linux x64
      </>
    );
  }
  return (
    <>
      <Monitor className="size-3.5" />
      Windows 10 / 11
    </>
  );
}

function platformSubtitle(os: AgentOs): string {
  if (os === "macos") {
    return "Runs in the menu bar and uploads sim telemetry in the background.";
  }
  if (os === "linux") {
    return "Runs in the system tray and currently focuses on F1 25 UDP telemetry.";
  }
  return "Runs in the system tray and uploads sim telemetry in the background.";
}

function platformRequirements(os: AgentOs): string {
  if (os === "macos") {
    return "macOS 12 or later, Apex Pro subscription, and an internet connection.";
  }
  if (os === "linux") {
    return "Linux x64 with AppImage support, Apex Pro subscription, and an internet connection.";
  }
  return "Windows 10 or 11, Apex Pro subscription, and an internet connection.";
}

function platformSupportNote(os: AgentOs): string | null {
  if (os === "windows") {
    return null;
  }
  if (os === "macos") {
    return "macOS currently supports F1 25 telemetry. iRacing and LMU automation are Windows-only.";
  }
  return "Linux support is currently limited to F1 25 telemetry. iRacing and LMU automation are Windows-only.";
}

function simStatusLabel(supported: boolean): string {
  return supported ? "Supported" : "Windows only";
}

export default function Agent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isPro = useIsProUser();
  const { selectedOs, setSelectedOs } = useDetectedAgentOs();
  const [isDownloading, setIsDownloading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const downloadFilename = AGENT_DOWNLOAD_FILENAMES[selectedOs];
  const platformLabel = AGENT_PLATFORM_LABELS[selectedOs];
  const alternateOses = ALL_AGENT_OSES.filter((os) => os !== selectedOs);
  const supportNote = platformSupportNote(selectedOs);

  async function handleDownloadClick() {
    if (authLoading) return;

    if (!user || !isPro) {
      setUpgradeModalOpen(true);
      return;
    }

    setIsDownloading(true);
    try {
      await downloadAgentBinary(selectedOs);
    } catch (err) {
      if (isProRequiredError(err)) {
        setUpgradeModalOpen(true);
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Sign in required", {
          description: "Log in with an Apex Pro account to download the agent.",
        });
        navigate("/login");
        return;
      }
      if (err instanceof ApiError && err.code === "AGENT_OBJECT_NOT_FOUND") {
        toast.error("Installer not published", {
          description:
            err.message ||
            "This platform’s installer has not been uploaded to storage yet. Try the other OS or check back later.",
        });
        return;
      }
      if (err instanceof ApiError && err.code === "AGENT_DOWNLOAD_DISABLED") {
        toast.error("Download temporarily unavailable", {
          description:
            err.message || "Agent downloads are disabled. Please try again later.",
        });
        return;
      }
      if (err instanceof ApiError && err.code === "AGENT_NOT_AVAILABLE") {
        toast.error("Download unavailable", {
          description:
            err.message || "No installer is configured on the server. Please try again later.",
        });
        return;
      }
      toast.error("Download failed", {
        description:
          err instanceof ApiError ? err.message : "Unable to start download. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <PageMeta title={agentTitle} description={agentDescription} path={AGENT_PATH} noindex />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/5">
                <Cpu className="size-7 text-white/70" />
              </div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                {platformBadge(selectedOs)}
              </div>
              <h1 className="text-2xl font-semibold text-white">Apex Agent</h1>
              <p className="mt-2 text-white/60">{platformSubtitle(selectedOs)}</p>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h2 className="mb-2 text-sm font-medium text-white/80">What it does</h2>
                <p className="text-sm text-white/50">
                  Apex Agent runs quietly in the {selectedOs === "macos" ? "menu bar" : "system tray"}.
                  When you finish a session in a supported simulator, it detects the completed data and
                  uploads telemetry to your Apex account in the background.
                </p>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-medium text-white/80">Supported simulators</h2>
                <div className="space-y-2">
                  {SUPPORTED_SIMS.map((sim) => {
                    const isSupported = sim.support[selectedOs];
                    return (
                      <div
                        key={sim.name}
                        className="rounded-lg bg-white/[0.03] px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <sim.icon
                            className={`size-4 shrink-0 ${
                              isSupported ? "text-green-500" : "text-white/30"
                            }`}
                          />
                          <span className="text-sm font-medium text-white/80">{sim.name}</span>
                          <span className="ml-auto text-xs text-white/40">
                            {simStatusLabel(isSupported)}
                          </span>
                        </div>
                        <p className="mt-1.5 pl-7 text-xs text-white/45">
                          {sim.detail[selectedOs]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-white/50">
                  <span className="text-white/70">Requirements:</span> {platformRequirements(selectedOs)}
                </p>
                {supportNote ? (
                  <p className="text-xs text-white/45">
                    <span className="text-white/70">Current scope:</span> {supportNote}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8">
              {authLoading ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white/60">
                  <Loader2 className="size-4 animate-spin" />
                  Checking subscription…
                </div>
              ) : isPro ? (
                <button
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Preparing download…
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      Download {downloadFilename}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownloadClick}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/15"
                >
                  <Lock className="size-4" />
                  Download for {platformLabel}
                </button>
              )}

              {!authLoading && !isPro && (
                <p className="mt-3 text-center text-xs text-white/40">
                  Apex Pro required for automatic telemetry uploads and agent download.
                </p>
              )}

              <div className="mt-4 text-center text-xs text-white/45">
                <p>Need another build?</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {alternateOses.map((os) => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => setSelectedOs(os)}
                      className="text-white/70 underline-offset-2 hover:text-white hover:underline"
                    >
                      Download for {AGENT_PLATFORM_LABELS[os]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BaseModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Apex Pro Required"
        description="Automatic telemetry uploads and the Apex Agent installer are available with Apex Pro."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Not now
            </Button>
            <Button
              className="bg-amber-500 text-black hover:bg-amber-400"
              onClick={() => {
                setUpgradeModalOpen(false);
                navigate("/pricing");
              }}
            >
              Upgrade to Pro
            </Button>
          </div>
        }
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
            Background F1 25 UDP telemetry capture
          </li>
          {selectedOs === "windows" && (
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
              Automatic iRacing session log uploads
            </li>
          )}
          {selectedOs === "windows" && (
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
              Automatic Le Mans Ultimate telemetry uploads
            </li>
          )}
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
            Unlimited session history and full analytics
          </li>
        </ul>
      </BaseModal>
    </>
  );
}
