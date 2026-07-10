import { cn } from "@/lib/utils";
import {
  v2InputClassName,
  v2ManualTextareaClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";

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
    <V2BaseModal
      isOpen={open}
      onClose={closeModal}
      title="Edit discussion"
      size="md"
      footer={
        <>
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={closeModal}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              v2PrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={onSave}
            disabled={
              saving ||
              editTitle.trim().length < 3 ||
              editDescription.trim().length < 10
            }
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {editError && (
          <p className="font-v2-body text-sm text-v2-error">{editError}</p>
        )}
        <div>
          <label className="mb-1.5 block font-v2-body text-sm font-medium text-v2-on-surface">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={saving}
            className={v2InputClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-v2-body text-sm font-medium text-v2-on-surface">
            Body
          </label>
          <textarea
            className={cn(v2ManualTextareaClassName, "min-h-[160px] resize-y")}
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>
    </V2BaseModal>
  );
}
