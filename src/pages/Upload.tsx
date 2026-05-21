import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  Loader2,
  PenLine,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSessionFile, ApiError } from "@/lib/api";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { MAX_MANUAL_UPLOAD_BYTES } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";

const UPLOAD_PATH = "/upload";
const uploadTitle = `Upload session | ${COMPANY_NAME}`;
const uploadDescription = `Upload .ibt telemetry to ${COMPANY_NAME} to process laps and share sessions.`;

const MAX_MB_LABEL = Math.round(MAX_MANUAL_UPLOAD_BYTES / (1024 * 1024));

type UploadState = "idle" | "uploading" | "success" | "error";
type UploadPhase = "bytes" | "processing";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get("challenge")?.trim() || undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("bytes");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challengeAttachWarning, setChallengeAttachWarning] = useState<string | null>(null);
  const [successSessionId, setSuccessSessionId] = useState<string | null>(null);
  const postSuccessNavRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isBusy = uploadState === "uploading";

  useEffect(() => {
    if (!isBusy) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Upload in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isBusy]);

  useEffect(() => {
    return () => {
      if (postSuccessNavRef.current) {
        clearTimeout(postSuccessNavRef.current);
        postSuccessNavRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.toLowerCase().split(".").pop();
    if (ext !== "ibt") {
      setErrorMessage("Only .ibt files are supported.");
      setUploadState("error");
      return;
    }

    if (selectedFile.size > MAX_MANUAL_UPLOAD_BYTES) {
      setErrorMessage(
        `File exceeds maximum size of ${MAX_MB_LABEL} MB (this file is ${formatFileSize(selectedFile.size)}).`
      );
      setUploadState("error");
      return;
    }

    setFile(selectedFile);
    setUploadState("idle");
    setErrorMessage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] ?? null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!file || isBusy) return;

    if (file.size > MAX_MANUAL_UPLOAD_BYTES) {
      setErrorMessage(
        `File exceeds maximum size of ${MAX_MB_LABEL} MB (this file is ${formatFileSize(file.size)}).`
      );
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setUploadPhase("bytes");
    setUploadPercent(0);
    setErrorMessage(null);
    setChallengeAttachWarning(null);
    setSuccessSessionId(null);

    try {
      const result = await uploadSessionFile(
        file,
        {
          onUploadProgress: (p) => {
            setUploadPercent(p);
            if (p >= 100) setUploadPhase("processing");
          },
          onUploadComplete: () => {
            setUploadPhase("processing");
            setUploadPercent(100);
          },
        },
        challengeId ? { challengeId } : undefined
      );

      const attachWarn =
        typeof result.challengeAttachWarning === "string" && result.challengeAttachWarning.trim()
          ? result.challengeAttachWarning.trim()
          : null;
      setChallengeAttachWarning(attachWarn);
      setSuccessSessionId(result.sessionId);
      setUploadState("success");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("apex:activity-updated"));
      }
      if (postSuccessNavRef.current) {
        clearTimeout(postSuccessNavRef.current);
        postSuccessNavRef.current = null;
      }
      const redirectMs = attachWarn ? 6000 : 1000;
      postSuccessNavRef.current = setTimeout(() => {
        postSuccessNavRef.current = null;
        navigate(`/sessions/${result.sessionId}`);
      }, redirectMs);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Upload failed. Please try again.";
      setErrorMessage(message);
      setUploadState("error");
    }
  }, [file, isBusy, navigate, challengeId]);

  const handleReset = useCallback(() => {
    setFile(null);
    setUploadState("idle");
    setUploadPhase("bytes");
    setUploadPercent(0);
    setErrorMessage(null);
    setChallengeAttachWarning(null);
    setSuccessSessionId(null);
    if (postSuccessNavRef.current) {
      clearTimeout(postSuccessNavRef.current);
      postSuccessNavRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <>
      <PageMeta title={uploadTitle} description={uploadDescription} path={UPLOAD_PATH} noindex />
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12 lg:max-w-xl">
          <div className="mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                Upload session
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                iRacing{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/70">.ibt</code>{" "}
                telemetry is processed automatically — session type, positions, and distance when
                available (max {MAX_MB_LABEL} MB).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card/20 p-5 shadow-sm backdrop-blur-lg sm:p-7">
            {challengeId && uploadState !== "success" && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <Trophy className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                <p className="text-sm text-amber-100/90">
                  This upload will count toward your active challenge when processed.
                </p>
              </div>
            )}

            {uploadState === "success" ? (
              <div className="py-10 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                    <CheckCircle className="size-7 text-green-500" />
                  </div>
                </div>
                <p className="text-lg font-medium text-white">Session uploaded</p>
                {challengeAttachWarning ? (
                  <>
                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-left">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-amber-200">
                          Not counted toward this challenge
                        </p>
                        <p className="mt-1 text-sm text-amber-100/90">{challengeAttachWarning}</p>
                        <p className="mt-2 text-xs text-amber-200/70">
                          Your laps are saved on the session, but this run did not qualify for the
                          challenge leaderboard.
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-white/50">Opening session in a few seconds…</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="mt-4 w-full border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        if (postSuccessNavRef.current) {
                          clearTimeout(postSuccessNavRef.current);
                          postSuccessNavRef.current = null;
                        }
                        if (successSessionId) navigate(`/sessions/${successSessionId}`);
                      }}
                    >
                      Continue to session
                    </Button>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-white/50">Redirecting to your session…</p>
                )}
              </div>
            ) : uploadState === "uploading" ? (
              <div className="py-10">
                <div className="mb-5 flex justify-center">
                  <Loader2 className="size-10 animate-spin text-white/60" />
                </div>
                <p className="text-center text-lg font-medium text-white">
                  {uploadPhase === "bytes" ? "Uploading…" : "Processing telemetry…"}
                </p>
                <p className="mt-2 text-center text-sm text-white/50">
                  {uploadPhase === "bytes"
                    ? "Sending file to the server."
                    : "Extracting laps and saving your session."}
                </p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full bg-white/70 transition-[width] duration-150 ease-out",
                      uploadPhase === "processing" && "animate-pulse"
                    )}
                    style={{
                      width:
                        uploadPhase === "bytes"
                          ? `${Math.max(0, Math.min(100, uploadPercent))}%`
                          : "100%",
                    }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-white/40">
                  {uploadPhase === "bytes" ? `${uploadPercent}%` : "Hang tight…"}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                  <header className="mb-4 border-b border-white/5 pb-3">
                    <h2 className="text-sm font-semibold text-white">Telemetry file</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Drag and drop or browse for an iRacing replay file.
                    </p>
                  </header>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors sm:p-10",
                      isDragOver
                        ? "border-white/40 bg-white/5"
                        : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ibt"
                      onChange={handleInputChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center text-center">
                      {file ? (
                        <>
                          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                            <FileText className="size-6 text-white/60" />
                          </div>
                          <p className="max-w-full truncate text-sm font-medium text-white">
                            {file.name}
                          </p>
                          <p className="mt-1 text-xs text-white/50">{formatFileSize(file.size)}</p>
                          <p className="mt-3 text-xs text-white/40">Click or drop to replace</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                            <UploadIcon className="size-6 text-white/60" />
                          </div>
                          <p className="text-sm text-white/70">Drag & drop your .ibt file here</p>
                          <p className="mt-1 text-xs text-white/50">
                            or click to browse (max {MAX_MB_LABEL} MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </section>

                {uploadState === "error" && errorMessage && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-3 border-t border-white/10 pt-5">
                  {file && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleUpload}
                    disabled={!file}
                    className={cn(
                      "bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40",
                      file ? "flex-1" : "w-full"
                    )}
                  >
                    Upload session
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-white/45">
            Don&apos;t have a telemetry file?{" "}
            <Link
              to="/manual"
              className="inline-flex items-center gap-1 font-medium text-white/70 transition-colors hover:text-white"
            >
              <PenLine className="size-3.5" aria-hidden />
              Log manual activity
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
