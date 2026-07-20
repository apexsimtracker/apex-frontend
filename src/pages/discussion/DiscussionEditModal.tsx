import { cn } from "@/lib/utils";
import {
  appInputClassName,
  appManualTextareaClassName,
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";

type DiscussionEditModalProps = {
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

export default function DiscussionEditModal({
  open,
  editTitle,
  editDescription,
  editError,
  saving,
  onClose,
  onSave,
  onTitleChange,
  onDescriptionChange,
}: DiscussionEditModalProps) {
  const closeModal = () => {
    if (saving) return;
    onClose();
  };

  if (!open) return null;

  return (
    <AppBaseModal
      isOpen={open}
      onClose={closeModal}
      title="Edit discussion"
      size="md"
      footer={
        <>
          <button
            type="button"
            className={cn(
              appOutlineButtonClassName,
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
              appPrimaryButtonClassName,
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
          <p className="font-apex-body text-sm text-apex-error">{editError}</p>
        )}
        <div>
          <label className="mb-1.5 block font-apex-body text-sm font-medium text-apex-on-surface">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={saving}
            className={appInputClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-apex-body text-sm font-medium text-apex-on-surface">
            Body
          </label>
          <textarea
            className={cn(appManualTextareaClassName, "min-h-[160px] resize-y")}
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>
    </AppBaseModal>
  );
}
