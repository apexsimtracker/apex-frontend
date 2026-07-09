import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DiscussionEditModalV2Props = {
  open: boolean;
  editTitle: string;
  editDescription: string;
  editError: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export default function DiscussionEditModalV2({
  open,
  editTitle,
  editDescription,
  editError,
  saving,
  onClose,
  onSave,
  onTitleChange,
  onDescriptionChange,
}: DiscussionEditModalV2Props) {
  const closeModal = () => {
    if (saving) return;
    onClose();
  };

  if (!open) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={closeModal}
      title="Edit discussion"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={
              saving ||
              editTitle.trim().length < 3 ||
              editDescription.trim().length < 10
            }
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {editError && <p className="text-sm text-destructive">{editError}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Title
          </label>
          <Input
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={saving}
            className="border-white/10 bg-secondary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Body
          </label>
          <Textarea
            className="min-h-[160px] resize-y border-white/10 bg-secondary"
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>
    </BaseModal>
  );
}
