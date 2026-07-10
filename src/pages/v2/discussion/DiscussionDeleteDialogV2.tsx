import { cn } from "@/lib/utils";
import {
  v2DestructiveButtonClassName,
  v2OutlineButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseAlertDialog } from "@/components/v2/ui/V2BaseModal";

type DiscussionDeleteDialogV2Props = {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DiscussionDeleteDialogV2({
  open,
  deleting,
  onClose,
  onConfirm,
}: DiscussionDeleteDialogV2Props) {
  return (
    <V2BaseAlertDialog
      isOpen={open}
      onClose={onClose}
      title="Delete this discussion?"
      description="This removes the post from the community. You can't undo this from the site; contact support if you deleted by mistake."
      footer={
        <>
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              v2DestructiveButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </>
      }
    />
  );
}
