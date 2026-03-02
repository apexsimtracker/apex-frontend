import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this manual activity?",
  message = "This cannot be undone.",
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete. Please try again."
      );
      setIsDeleting(false);
    }
  }

  function handleClose() {
    if (isDeleting) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1 text-white/40 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm text-white/60">{message}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
