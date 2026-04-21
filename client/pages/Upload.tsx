import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  Loader2,
  PenLine,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSessionFile, ApiError } from "@/lib/api";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { MAX_MANUAL_UPLOAD_BYTES } from "@/lib/uploadLimits";

const UPLOAD_PATH = "/upload";
const uploadTitle = `Upload session | ${COMPANY_NAME}`;
const uploadDescription = `Upload .ibt telemetry to ${COMPANY_NAME} to process laps and share sessions—${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("bytes");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    try {
      const result = await uploadSessionFile(file, {
        onUploadProgress: (p) => {
          setUploadPercent(p);
          if (p >= 100) setUploadPhase("processing");
        },
        onUploadComplete: () => {
          setUploadPhase("processing");
          setUploadPercent(100);
        },
      });

      setUploadState("success");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("apex:activity-updated"));
      }
      setTimeout(() => {
        navigate(`/sessions/${result.sessionId}`);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Upload failed. Please try again.";
      setErrorMessage(message);
      setUploadState("error");
    }
  }, [file, isBusy, navigate]);

  const handleReset = useCallback(() => {
    setFile(null);
    setUploadState("idle");
    setUploadPhase("bytes");
    setUploadPercent(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <>
      <PageMeta title={uploadTitle} description={uploadDescription} path={UPLOAD_PATH} />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white">Upload Session</h1>
            <p className="mt-1 text-sm text-white/60">
              Upload telemetry files manually (max {MAX_MB_LABEL} MB).
            </p>
          </div>

          {uploadState === "success" ? (
            <div className="py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="size-6 text-green-500" />
                </div>
              </div>
              <p className="font-medium text-white">Session uploaded!</p>
              <p className="mt-1 text-sm text-white/50">
                Redirecting to session…
              </p>
            </div>
          ) : uploadState === "uploading" ? (
            <div className="py-8">
              <div className="mb-4 flex justify-center">
                <Loader2 className="size-10 animate-spin text-white/60" />
              </div>
              <p className="text-center font-medium text-white">
                {uploadPhase === "bytes"
                  ? "Uploading…"
                  : "Processing telemetry…"}
              </p>
              <p className="mt-1 text-center text-sm text-white/50">
                {uploadPhase === "bytes"
                  ? "Sending file to the server."
                  : "Extracting laps and saving your session."}
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-white/70 transition-[width] duration-150 ease-out ${
                    uploadPhase === "processing" ? "animate-pulse" : ""
                  }`}
                  style={{
                    width:
                      uploadPhase === "bytes"
                        ? `${Math.max(0, Math.min(100, uploadPercent))}%`
                        : "100%",
                  }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-white/40">
                {uploadPhase === "bytes"
                  ? `${uploadPercent}%`
                  : "Hang tight…"}
              </p>
            </div>
          ) : (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors
                  ${isDragOver ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20"}
                `}
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
                      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white/5">
                        <FileText className="size-5 text-white/60" />
                      </div>
                      <p className="text-sm font-medium text-white">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {formatFileSize(file.size)}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white/5">
                        <UploadIcon className="size-5 text-white/60" />
                      </div>
                      <p className="text-sm text-white/70">
                        Drag & drop your .ibt file here
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        or click to browse (max {MAX_MB_LABEL} MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {uploadState === "error" && errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {file && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file}
                  className={`bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 ${file ? "flex-1" : "w-full"}`}
                >
                  Upload
                </Button>
              </div>

              {/* Manual activity link */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="text-center">
                  <p className="mb-3 text-xs text-white/40">
                    Don&apos;t have a telemetry file?
                  </p>
                  <Link
                    to="/manual"
                    className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    <PenLine className="size-4" />
                    Log a manual activity
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
