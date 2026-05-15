import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BaseAlertDialog } from "@/components/ui/base-modal";
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

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

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
    <BaseAlertDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20"
            aria-hidden
          >
            <AlertTriangle className="size-5 text-destructive" />
          </span>
          <span className="min-w-0 flex-1 pt-0.5">{title}</span>
        </span>
      }
      description={message}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </>
      }
    >
      {error ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </BaseAlertDialog>
  );
}
