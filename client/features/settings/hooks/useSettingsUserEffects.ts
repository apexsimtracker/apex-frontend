import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SessionVisibility, AuthUser } from "@/lib/api";
import type { SettingsDisplayNameValues, DeleteAccountFormValues } from "@/lib/validation/settingsForms";
import type { ApexSettings } from "@/lib/settingsStorage";
import { setApexSettings } from "@/lib/settingsStorage";

/**
 * Resets the display name field when the signed-in `user` changes.
 */
export function useDisplayNameFormResetEffect(
  user: AuthUser | null,
  displayNameForm: UseFormReturn<
    WithRootError<SettingsDisplayNameValues>,
    unknown,
    WithRootError<SettingsDisplayNameValues>
  >
) {
  useEffect(() => {
    if (user) {
      displayNameForm.reset({
        displayName: (user as { displayName?: string }).displayName ?? user.email ?? "",
      });
    }
  }, [user, displayNameForm]);
}

/**
 * Merges server user privacy/notification fields into local Apex settings state.
 */
export function useApexFromServerUserEffect(
  user: AuthUser | null,
  setSettings: Dispatch<SetStateAction<ApexSettings>>
) {
  useEffect(() => {
    if (!user) return;
    const u = user as {
      privateProfile?: boolean;
      manualFollowApproval?: boolean;
      sessionVisibility?: SessionVisibility;
      emailNotifications?: boolean;
      showNotificationBadge?: boolean;
    };
    setSettings((prev) => ({
      ...prev,
      ...(typeof u.privateProfile === "boolean" ? { privateProfile: u.privateProfile } : {}),
      ...(typeof u.manualFollowApproval === "boolean" ? { manualFollowApproval: u.manualFollowApproval } : {}),
      ...(u.sessionVisibility === "PUBLIC" || u.sessionVisibility === "FOLLOWERS_ONLY" || u.sessionVisibility === "PRIVATE"
        ? { sessionVisibility: u.sessionVisibility }
        : {}),
      ...(typeof u.emailNotifications === "boolean" ? { emailNotifications: u.emailNotifications } : {}),
      ...(typeof u.showNotificationBadge === "boolean" ? { showNotificationBadge: u.showNotificationBadge } : {}),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- field-level deps mirror previous Settings page (avoids `user` object in deps)
  }, [
    user?.id,
    user?.privateProfile,
    user?.manualFollowApproval,
    user?.sessionVisibility,
    user?.emailNotifications,
    user?.showNotificationBadge,
    setSettings,
  ]);
}

export function usePersistApexToStorageEffect(settings: ApexSettings) {
  useEffect(() => {
    setApexSettings(settings);
  }, [settings]);
}

export function useDeleteAccountFormOnDialogEffect(
  deleteDialogOpen: boolean,
  deleteAccountForm: UseFormReturn<
    WithRootError<DeleteAccountFormValues>,
    unknown,
    WithRootError<DeleteAccountFormValues>
  >
) {
  useEffect(() => {
    if (deleteDialogOpen) {
      deleteAccountForm.reset({ password: "", confirmPhrase: "" });
    }
  }, [deleteDialogOpen, deleteAccountForm]);
}
