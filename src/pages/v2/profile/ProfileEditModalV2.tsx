import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WithRootError } from "@/lib/formWithRootError";
import type { ProfileEditFormValues } from "@/lib/validation/profileEdit";
import { cn } from "@/lib/utils";
import {
  v2InputClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProfileEditModalV2Props = {
  open: boolean;
  onClose: () => void;
  profileEditForm: UseFormReturn<WithRootError<ProfileEditFormValues>>;
  onSave: (values: ProfileEditFormValues) => void | Promise<void>;
  editLoading: boolean;
  editSuccess: boolean;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  avatarPreview: string | null;
  avatarError: string | null;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatarSelection: () => void;
};

export default function ProfileEditModalV2({
  open,
  onClose,
  profileEditForm,
  onSave,
  editLoading,
  editSuccess,
  avatarInputRef,
  avatarPreview,
  avatarError,
  onAvatarFileChange,
  onClearAvatarSelection,
}: ProfileEditModalV2Props) {
  const handleClose = () => {
    onClearAvatarSelection();
    onClose();
  };

  return (
    <V2BaseModal
      isOpen={open}
      onClose={handleClose}
      title="Edit Profile"
      description="Update your display name, bio, and profile picture."
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
            disabled={editLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form-v2"
            className={cn(
              v2PrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={
              editLoading ||
              profileEditForm.watch("displayName").trim().length < 2
            }
          >
            {editLoading ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <Form {...profileEditForm}>
        <form
          id="edit-profile-form-v2"
          onSubmit={profileEditForm.handleSubmit(onSave)}
          className="space-y-4"
        >
          <FormRootMessage className="rounded-v2-sm bg-v2-error/10 px-3 py-2 font-v2-body text-sm text-v2-error" />
          {editSuccess && (
            <p className="rounded-v2-sm bg-v2-success/10 px-3 py-2 font-v2-body text-sm text-v2-success">
              Profile updated.
            </p>
          )}

          <FormField
            control={profileEditForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="edit-displayName-v2"
                  className="font-v2-body text-v2-on-surface"
                >
                  Display name
                </FormLabel>
                <FormControl>
                  <Input
                    id="edit-displayName-v2"
                    type="text"
                    className={v2InputClassName}
                    placeholder="Your name"
                    maxLength={40}
                    disabled={editLoading}
                    {...field}
                  />
                </FormControl>
                <p className="mt-0.5 font-v2-body text-xs text-v2-on-surface-variant">
                  {field.value.trim().length}/40
                </p>
                <FormMessage className="font-v2-body text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={profileEditForm.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="edit-tagline-v2"
                  className="font-v2-body text-v2-on-surface"
                >
                  Bio
                </FormLabel>
                <FormControl>
                  <Textarea
                    id="edit-tagline-v2"
                    className={cn(v2InputClassName, "min-h-[80px] resize-y")}
                    placeholder="A short bio..."
                    maxLength={160}
                    disabled={editLoading}
                    {...field}
                  />
                </FormControl>
                <p className="mt-0.5 font-v2-body text-xs text-v2-on-surface-variant">
                  {field.value.length}/160
                </p>
                <FormMessage className="font-v2-body text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <div>
            <label className="mb-1 block font-v2-body text-sm font-medium text-v2-on-surface">
              Profile picture
            </label>
            <p className="mb-2 font-v2-body text-xs text-v2-on-surface-variant">
              Choose an image from your device (JPEG, PNG, or WebP, max 5 MB).
              Images are cropped to a square on upload.
            </p>
            <input
              ref={avatarInputRef}
              id="edit-avatar-file-v2"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={onAvatarFileChange}
              className="w-full font-v2-body text-sm text-v2-on-surface file:mr-3 file:rounded-v2-sm file:border-0 file:bg-v2-surface-container-highest file:px-3 file:py-2 file:text-sm file:font-medium file:text-v2-on-surface hover:file:bg-v2-surface-container-high"
              disabled={editLoading}
            />
            {avatarError && (
              <p className="mt-1.5 font-v2-body text-sm text-v2-error">
                {avatarError}
              </p>
            )}
            {avatarPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="size-16 rounded-full border border-v2-outline-variant/20 bg-v2-surface-container-highest object-cover"
                />
                <button
                  type="button"
                  onClick={onClearAvatarSelection}
                  disabled={editLoading}
                  className="font-v2-body text-sm text-v2-on-surface-variant underline underline-offset-2 hover:text-v2-on-surface"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </form>
      </Form>
    </V2BaseModal>
  );
}
