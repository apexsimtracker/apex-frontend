import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Cpu,
  Download,
  Lock,
  CheckCircle,
  Loader2,
  Radio,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
import { AgentInstallRequirements } from "@/components/agent/AgentInstallRequirements";
import { AgentPlatformSelector } from "@/components/agent/AgentPlatformSelector";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { downloadAgentBinary } from "@/lib/api/agentDownload";
import { ApiError, isProRequiredError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BRAND_RED } from "@/lib/appConfig";
import {
  AGENT_DOWNLOAD_FILENAMES,
  AGENT_PLATFORM_LABELS,
  type AgentOs,
  useDetectedAgentOs,
} from "@/hooks/useDetectedAgentOs";

const AGENT_PATH = "/agent";
const agentTitle = `Apex Agent | ${COMPANY_NAME}`;
const agentDescription = `Download the ${COMPANY_NAME} Agent for macOS, Windows, and Linux — a background service that captures sim telemetry and uploads sessions automatically with Apex Pro.`;

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

function platformSubtitle(os: AgentOs): string {
  if (os === "macos") {
    return "Runs in the menu bar and uploads sim telemetry in the background.";
  }
  if (os === "linux") {
    return "Runs in the system tray and currently focuses on F1 25 UDP telemetry.";
  }
  return "Runs in the system tray and uploads sim telemetry in the background.";
}

function simStatusLabel(supported: boolean): string {
  return supported ? "Supported" : "Windows only";
}

function cardSectionClassName() {
  return "rounded-xl border border-white/10 bg-card/50 p-6 sm:p-7";
}

export default function Agent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isPro = useIsProUser();
  const { selectedOs, setSelectedOs } = useDetectedAgentOs();
  const [isDownloading, setIsDownloading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const showWelcomeBanner = searchParams.get("welcome") === "pro";

  const downloadFilename = AGENT_DOWNLOAD_FILENAMES[selectedOs];
  const platformLabel = AGENT_PLATFORM_LABELS[selectedOs];

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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-white/10 bg-muted/30">
            <Cpu className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Apex Agent
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {platformSubtitle(selectedOs)}
          </p>
        </div>

        <div className="mb-6">
          <AgentPlatformSelector selectedOs={selectedOs} onSelect={setSelectedOs} />
        </div>

        {showWelcomeBanner && isPro && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-foreground">
            <p className="font-medium text-green-400">Welcome to Apex Pro!</p>
            <p className="mt-1 text-muted-foreground">
              Download the agent below, then sign in with the same email and password you use on
              this website.
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => {
                searchParams.delete("welcome");
                setSearchParams(searchParams, { replace: true });
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-6">
          <section className={cardSectionClassName()}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              What it does
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Apex Agent runs quietly in the {selectedOs === "macos" ? "menu bar" : "system tray"}.
              When you finish a session in a supported simulator, it detects the completed data and
              uploads telemetry to your Apex account in the background.
            </p>
          </section>

          <section className={cardSectionClassName()}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Supported simulators
            </h2>
            <div className="mt-4 space-y-2">
              {SUPPORTED_SIMS.map((sim) => {
                const isSupported = sim.support[selectedOs];
                return (
                  <div
                    key={sim.name}
                    className="rounded-lg border border-white/10 bg-muted/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <sim.icon
                        className={`size-4 shrink-0 ${
                          isSupported ? "text-green-500" : "text-muted-foreground/50"
                        }`}
                        aria-hidden
                      />
                      <span className="text-sm font-medium text-foreground">{sim.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {simStatusLabel(isSupported)}
                      </span>
                    </div>
                    <p className="mt-1.5 pl-7 text-xs text-muted-foreground">
                      {sim.detail[selectedOs]}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={cardSectionClassName()}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              After you install
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-medium text-foreground">
                  1
                </span>
                <span>
                  Open Apex Agent from your{" "}
                  {selectedOs === "macos" ? "menu bar" : "system tray"} (look for the Apex icon).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-medium text-foreground">
                  2
                </span>
                <span>
                  Sign in with the <strong className="font-medium text-foreground">same email and password</strong>{" "}
                  as your {COMPANY_NAME} account. No separate activation code is required.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-medium text-foreground">
                  3
                </span>
                <span>
                  The agent minimizes to the {selectedOs === "macos" ? "menu bar" : "system tray"} and
                  uploads sessions automatically while you race.
                </span>
              </li>
            </ol>
          </section>

          <AgentInstallRequirements os={selectedOs} />
        </div>

        <div className="mt-8">
          {authLoading ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Checking subscription…
            </div>
          ) : isPro ? (
            <Button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_RED }}
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
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDownloadClick}
              className="w-full border-white/15"
            >
              <Lock className="size-4" />
              Download for {platformLabel}
            </Button>
          )}

          {!authLoading && !isPro && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Apex Pro required for automatic telemetry uploads and agent download.
            </p>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Home
          </Link>
        </div>
      </div>

      <BaseModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Apex Pro Required"
        description="Automatic telemetry uploads and the Apex Agent installer are available with Apex Pro."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="border-white/15" onClick={() => setUpgradeModalOpen(false)}>
              Not now
            </Button>
            <Button
              className="text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_RED }}
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
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden />
            Background F1 25 UDP telemetry capture
          </li>
          {selectedOs === "windows" && (
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden />
              Automatic iRacing session log uploads
            </li>
          )}
          {selectedOs === "windows" && (
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden />
              Automatic Le Mans Ultimate telemetry uploads
            </li>
          )}
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden />
            Unlimited session history and full analytics
          </li>
        </ul>
      </BaseModal>
    </>
  );
}
