import { Button } from "@/components/ui/button";
import { BaseAlertDialog } from "@/components/ui/base-modal";

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
    <BaseAlertDialog
      isOpen={open}
      onClose={onClose}
      title="Delete this discussion?"
      description="This removes the post from the community. You can't undo this from the site; contact support if you deleted by mistake."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    />
  );
}
