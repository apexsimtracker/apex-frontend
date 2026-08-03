import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SessionVisibility, AuthUser, InAppNotificationPrefs } from "@/lib/api";
import type {
  SettingsAccountFormValues,
  DeleteAccountFormValues,
} from "@/lib/validation/settingsForms";
import type { ApexSettings } from "@/lib/settingsStorage";
import { setApexSettings } from "@/lib/settingsStorage";

/**
 * Resets Account form fields when the signed-in `user` changes.
 */
export function useAccountFormResetEffect(
  user: AuthUser | null,
  accountForm: UseFormReturn<
    WithRootError<SettingsAccountFormValues>,
    unknown,
    WithRootError<SettingsAccountFormValues>
  >,
) {
  useEffect(() => {
    if (user) {
      const bio = user.bio?.trim() ?? user.tagline?.trim() ?? "";
      accountForm.reset({
        displayName: user.displayName ?? user.email ?? "",
        tagline: bio,
      });
    }
  }, [user, accountForm]);
}

/** @deprecated Use useAccountFormResetEffect */
export const useDisplayNameFormResetEffect = useAccountFormResetEffect;

/**
 * Merges server user privacy/notification fields into local Apex settings state.
 */
export function useApexFromServerUserEffect(
  user: AuthUser | null,
  setSettings: Dispatch<SetStateAction<ApexSettings>>,
) {
  useEffect(() => {
    if (!user) return;
    const u = user as {
      privateProfile?: boolean;
      manualFollowApproval?: boolean;
      sessionVisibility?: SessionVisibility;
      emailNotifications?: boolean;
      showNotificationBadge?: boolean;
      inAppNotificationPrefs?: InAppNotificationPrefs;
    };
    setSettings((prev) => ({
      ...prev,
      ...(typeof u.privateProfile === "boolean"
        ? { privateProfile: u.privateProfile }
        : {}),
      ...(typeof u.manualFollowApproval === "boolean"
        ? { manualFollowApproval: u.manualFollowApproval }
        : {}),
      ...(u.sessionVisibility === "PUBLIC" ||
      u.sessionVisibility === "FOLLOWERS_ONLY" ||
      u.sessionVisibility === "PRIVATE"
        ? { sessionVisibility: u.sessionVisibility }
        : {}),
      ...(typeof u.emailNotifications === "boolean"
        ? { emailNotifications: u.emailNotifications }
        : {}),
      ...(typeof u.showNotificationBadge === "boolean"
        ? { showNotificationBadge: u.showNotificationBadge }
        : {}),
      ...(u.inAppNotificationPrefs
        ? { inAppNotificationPrefs: u.inAppNotificationPrefs }
        : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- field-level deps mirror previous Settings page (avoids `user` object in deps)
  }, [
    user?.id,
    user?.privateProfile,
    user?.manualFollowApproval,
    user?.sessionVisibility,
    user?.emailNotifications,
    user?.showNotificationBadge,
    user?.inAppNotificationPrefs,
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
  >,
) {
  useEffect(() => {
    if (deleteDialogOpen) {
      deleteAccountForm.reset({ password: "", confirmPhrase: "" });
    }
  }, [deleteDialogOpen, deleteAccountForm]);
}
