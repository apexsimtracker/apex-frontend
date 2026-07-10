import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  v2DestructiveButtonClassName,
  v2OutlineButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseAlertDialog } from "@/components/v2/ui/V2BaseModal";

interface DeleteConfirmModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
}

export default function DeleteConfirmModalV2({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this manual activity?",
  message = "This cannot be undone.",
}: DeleteConfirmModalV2Props) {
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
        err instanceof Error
          ? err.message
          : "Failed to delete. Please try again.",
      );
      setIsDeleting(false);
    }
  }

  function handleClose() {
    if (isDeleting) return;
    onClose();
  }

  return (
    <V2BaseAlertDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={message}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              v2DestructiveButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
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
          </button>
        </>
      }
      bodyClassName="space-y-4 text-center"
    >
      <div className="flex justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-v2-error/10">
          <AlertTriangle className="size-6 text-v2-error" />
        </div>
      </div>
      {error && (
        <div className="rounded-v2-sm bg-v2-error/10 px-3 py-2">
          <p className="text-center font-v2-body text-sm text-v2-error">
            {error}
          </p>
        </div>
      )}
    </V2BaseAlertDialog>
  );
}
