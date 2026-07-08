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
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { uploadSessionFile, ApiError } from "@/lib/api";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { MAX_MANUAL_UPLOAD_BYTES } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";

const UPLOAD_PATH = "/v2/upload";
const uploadTitle = `Upload session | ${COMPANY_NAME}`;
const uploadDescription = `Upload .ibt telemetry to ${COMPANY_NAME} to process laps and share sessions.`;

const MAX_MB_LABEL = Math.round(MAX_MANUAL_UPLOAD_BYTES / (1024 * 1024));

const SECTION_LABEL_CLASS =
  "font-v2-headline text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant";

type UploadState = "idle" | "uploading" | "success" | "error";
type UploadPhase = "bytes" | "processing";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get("challenge")?.trim() || undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("bytes");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challengeAttachWarning, setChallengeAttachWarning] = useState<
    string | null
  >(null);
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
        `File exceeds maximum size of ${MAX_MB_LABEL} MB (this file is ${formatFileSize(selectedFile.size)}).`,
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
    [handleFileSelect],
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
    [handleFileSelect],
  );

  const handleUpload = useCallback(async () => {
    if (!file || isBusy) return;

    if (file.size > MAX_MANUAL_UPLOAD_BYTES) {
      setErrorMessage(
        `File exceeds maximum size of ${MAX_MB_LABEL} MB (this file is ${formatFileSize(file.size)}).`,
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
        challengeId ? { challengeId } : undefined,
      );

      const attachWarn =
        typeof result.challengeAttachWarning === "string" &&
        result.challengeAttachWarning.trim()
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
        navigate(`/v2/sessions/${result.sessionId}`);
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
      <PageMeta
        title={uploadTitle}
        description={uploadDescription}
        path={UPLOAD_PATH}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="mb-10">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Upload session
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-v2-on-surface-variant">
            iRacing{" "}
            <code className="rounded bg-v2-surface-container-highest px-1.5 py-0.5 text-xs text-v2-on-surface">
              .ibt
            </code>{" "}
            telemetry is processed automatically — session type, positions, and
            distance when available (max {MAX_MB_LABEL} MB).
          </p>
        </div>

        {challengeId && uploadState !== "success" && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <Trophy
              className="mt-0.5 size-4 shrink-0 text-amber-400"
              aria-hidden
            />
            <p className="text-sm text-amber-100/90">
              This upload will count toward your active challenge when processed.
            </p>
          </div>
        )}

        <div className="mx-auto w-full max-w-2xl">
          {uploadState === "success" ? (
            <div className="rounded-lg bg-v2-surface-container-low py-10 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-v2-success/10 ring-1 ring-v2-success/20">
                  <CheckCircle className="size-7 text-v2-success" />
                </div>
              </div>
              <p className="text-lg font-medium text-v2-on-surface">
                Session uploaded
              </p>
              {challengeAttachWarning ? (
                <>
                  <div className="mx-auto mt-5 max-w-md text-left">
                    <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-amber-200">
                          Not counted toward this challenge
                        </p>
                        <p className="mt-1 text-sm text-amber-100/90">
                          {challengeAttachWarning}
                        </p>
                        <p className="mt-2 text-xs text-amber-200/70">
                          Your laps are saved on the session, but this run did
                          not qualify for the challenge leaderboard.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-v2-on-surface-variant">
                    Opening session in a few seconds…
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("mt-4 w-full rounded-[0.5rem]", v2OutlineButtonClassName)}
                    onClick={() => {
                      if (postSuccessNavRef.current) {
                        clearTimeout(postSuccessNavRef.current);
                        postSuccessNavRef.current = null;
                      }
                      if (successSessionId)
                        navigate(`/v2/sessions/${successSessionId}`);
                    }}
                  >
                    Continue to session
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-sm text-v2-on-surface-variant">
                  Redirecting to your session…
                </p>
              )}
            </div>
          ) : uploadState === "uploading" ? (
            <div className="rounded-lg bg-v2-surface-container-low p-6 py-10">
              <div className="mb-5 flex justify-center">
                <Loader2 className="size-10 animate-spin text-v2-on-surface-variant" />
              </div>
              <p className="text-center text-lg font-medium text-v2-on-surface">
                {uploadPhase === "bytes"
                  ? "Uploading…"
                  : "Processing telemetry…"}
              </p>
              <p className="mt-2 text-center text-sm text-v2-on-surface-variant">
                {uploadPhase === "bytes"
                  ? "Sending file to the server."
                  : "Extracting laps and saving your session."}
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-v2-surface-container-highest">
                {uploadPhase === "bytes" ? (
                  <div
                    className="v2-primary-gradient h-full rounded-full transition-[width] duration-150 ease-out"
                    style={{
                      width: `${Math.max(0, Math.min(100, uploadPercent))}%`,
                    }}
                  />
                ) : (
                  <div
                    className="v2-upload-indeterminate-track h-full"
                    role="progressbar"
                    aria-valuetext="Processing telemetry"
                    aria-label="Processing telemetry"
                  >
                    <div className="v2-upload-indeterminate-bar" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-center text-xs text-v2-on-surface-variant">
                {uploadPhase === "bytes"
                  ? `${uploadPercent}%`
                  : "Processing on server…"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-4 sm:p-5">
              <header className="mb-4 border-b border-v2-outline-variant/10 pb-3">
                <h2 className={SECTION_LABEL_CLASS}>Telemetry file</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-v2-on-surface-variant">
                  Drag and drop or browse for an iRacing replay file.
                </p>
              </header>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative cursor-pointer rounded-[0.5rem] border-2 border-dashed p-8 transition-colors sm:p-10",
                  isDragOver
                    ? "border-v2-primary/50 bg-v2-surface-container-high"
                    : "border-v2-outline-variant/40 hover:border-v2-outline-variant/70 hover:bg-v2-surface-container-high/60",
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
                      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-v2-surface-container-highest ring-1 ring-v2-outline-variant/20">
                        <FileText className="size-6 text-v2-on-surface-variant" />
                      </div>
                      <p className="max-w-full truncate text-sm font-medium text-v2-on-surface">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-v2-on-surface-variant">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="mt-3 text-xs text-v2-on-surface-variant">
                        Click or drop to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-v2-surface-container-highest ring-1 ring-v2-outline-variant/20">
                        <UploadIcon className="size-6 text-v2-on-surface-variant" />
                      </div>
                      <p className="text-sm text-v2-on-surface">
                        Drag &amp; drop your .ibt file here
                      </p>
                      <p className="mt-1 text-xs text-v2-on-surface-variant">
                        or click to browse (max {MAX_MB_LABEL} MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {uploadState === "error" && errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-v2-error/20 bg-v2-error/10 p-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-v2-error" />
                  <p className="text-sm text-v2-error">{errorMessage}</p>
                </div>
              )}

              <div className="flex gap-3 border-t border-v2-outline-variant/10 pt-6">
                {file && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className={cn("flex-1 rounded-[0.5rem]", v2OutlineButtonClassName)}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file}
                  className={cn(
                    v2PrimaryButtonClassName,
                    "rounded-[0.5rem]",
                    file ? "flex-1" : "w-full",
                  )}
                >
                  Upload session
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-v2-on-surface-variant">
          Don&apos;t have a telemetry file?{" "}
          <Link
            to="/v2/manual"
            className="inline-flex items-center gap-1 font-medium text-v2-on-surface transition-colors hover:text-v2-primary"
          >
            <PenLine className="size-3.5" aria-hidden />
            Log manual activity
          </Link>
        </p>
      </div>
    </>
  );
}
