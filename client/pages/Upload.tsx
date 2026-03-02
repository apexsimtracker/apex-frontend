import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileText, AlertCircle, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSessionFile, ApiError } from "@/lib/api";

type UploadState = "idle" | "uploading" | "error";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isUploading = uploadState === "uploading";

  useEffect(() => {
    if (!isUploading) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Upload in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.toLowerCase().split(".").pop();
    if (ext !== "ibt") {
      setErrorMessage("Only .ibt files are supported.");
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
    if (!file || isUploading) return;

    setUploadState("uploading");
    setErrorMessage(null);

    try {
      await uploadSessionFile(file);
      navigate("/?uploaded=1");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Upload failed. Please try again.";
      setErrorMessage(message);
      setUploadState("error");
    }
  }, [file, isUploading, navigate]);

  const handleReset = useCallback(() => {
    setFile(null);
    setUploadState("idle");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">Upload Session</h1>
            <p className="mt-1 text-sm text-white/60">
              Upload telemetry files manually.
            </p>
          </div>

          {isUploading ? (
            <div className="py-12 text-center">
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-white/60" />
              </div>
              <p className="text-white font-medium">Processing session…</p>
              <p className="mt-1 text-sm text-white/50">
                This may take a moment.
              </p>
            </div>
          ) : (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer
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
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                        <FileText className="h-5 w-5 text-white/60" />
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
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                        <UploadIcon className="h-5 w-5 text-white/60" />
                      </div>
                      <p className="text-sm text-white/70">
                        Drag & drop your .ibt file here
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
              </div>

              {uploadState === "error" && errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
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
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/40 mb-3">
                    Don't have a telemetry file?
                  </p>
                  <Link
                    to="/manual"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <PenLine className="h-4 w-4" />
                    Log a manual activity
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
