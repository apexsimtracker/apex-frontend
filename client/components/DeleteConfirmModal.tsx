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
      title={title}
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
      bodyClassName="space-y-4 text-center"
    >
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
        </div>
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2">
            <p className="text-center text-sm text-destructive">{error}</p>
          </div>
        )}
    </BaseAlertDialog>
  );
}
