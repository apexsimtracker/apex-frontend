import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SettingsAccountFormValues } from "@/lib/validation/settingsForms";
import type { AuthUser } from "@/lib/api";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/avatarUpload";
import { cn } from "@/lib/utils";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import {
  appAccountInputClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";

type SettingsAccountSectionProps = {
  user: AuthUser;
  accountForm: UseFormReturn<WithRootError<SettingsAccountFormValues>>;
  onSaveAccount: (values: SettingsAccountFormValues) => void | Promise<void>;
  saveDisabled: boolean;
  saving: boolean;
  success: boolean;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  avatarPreview: string | null;
  avatarError: string | null;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatarSelection: () => void;
};

export default function SettingsAccountSection({
  user,
  accountForm,
  onSaveAccount,
  saveDisabled,
  saving,
  success,
  avatarInputRef,
  avatarPreview,
  avatarError,
  onAvatarFileChange,
  onClearAvatarSelection,
}: SettingsAccountSectionProps) {
  const displayName =
    user.displayName?.trim() || user.email?.trim() || "Driver";
  const previewSrc = avatarPreview || user.avatarUrl || null;

  return (
    <SettingsSectionChrome title="Account">
      <Form {...accountForm}>
        <form
          onSubmit={accountForm.handleSubmit(onSaveAccount)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-start gap-2">
              <UserAvatar
                name={displayName}
                avatarUrl={previewSrc}
                size="lg"
                alt="Profile picture preview"
              />
              {avatarPreview ? (
                <button
                  type="button"
                  onClick={onClearAvatarSelection}
                  disabled={saving}
                  className="font-apex-body text-xs text-apex-on-surface-variant underline underline-offset-2 hover:text-apex-on-surface"
                >
                  Remove selection
                </button>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <label
                htmlFor="settings-avatar-file"
                className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant"
              >
                Profile picture
              </label>
              <p className="font-apex-body text-xs text-apex-on-surface-variant">
                JPEG, PNG, or WebP, max 5 MB. Cropped to a square on upload.
              </p>
              <input
                ref={avatarInputRef}
                id="settings-avatar-file"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={onAvatarFileChange}
                disabled={saving}
                className="w-full font-apex-body text-sm text-apex-on-surface file:mr-3 file:rounded-apex-sm file:border-0 file:bg-apex-surface-container-highest file:px-3 file:py-2 file:text-sm file:font-medium file:text-apex-on-surface hover:file:bg-apex-surface-container-high"
              />
              {avatarError ? (
                <p className="font-apex-body text-xs text-apex-error">
                  {avatarError}
                </p>
              ) : null}
            </div>
          </div>

          <FormField
            control={accountForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label
                  htmlFor="settings-displayName"
                  className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant"
                >
                  Display Name
                </label>
                <FormControl>
                  <Input
                    id="settings-displayName"
                    placeholder="Enter display name"
                    maxLength={40}
                    disabled={saving}
                    className={appAccountInputClassName}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      accountForm.clearErrors("root");
                    }}
                  />
                </FormControl>
                <p className="font-apex-body text-[10px] text-apex-on-surface-variant">
                  {field.value.trim().length}/40
                </p>
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />
          <FormField
            control={accountForm.control}
            name="tagline"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label
                  htmlFor="settings-bio"
                  className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant"
                >
                  Bio
                </label>
                <FormControl>
                  <Textarea
                    id="settings-bio"
                    placeholder="A short bio..."
                    maxLength={160}
                    disabled={saving}
                    className={cn(
                      appAccountInputClassName,
                      "h-20 resize-none",
                    )}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      accountForm.clearErrors("root");
                    }}
                  />
                </FormControl>
                <p className="font-apex-body text-[10px] text-apex-on-surface-variant">
                  {field.value.length}/160
                </p>
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />
          <FormRootMessage className="text-xs text-apex-error" />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={saveDisabled}
              className={appPrimaryButtonClassName}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {success && <p className="text-xs text-apex-success">Saved</p>}
          </div>
        </form>
      </Form>
    </SettingsSectionChrome>
  );
}
