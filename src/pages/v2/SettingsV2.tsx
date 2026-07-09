import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import { clearToken } from "@/auth/token";
import {
  authLogout,
  updateMe,
  changePassword,
  deleteAccount,
  downloadUserDataExport,
  ApiError,
  patchPrivacySettings,
  patchNotificationSettings,
  type DataExportFormat,
  type SessionVisibility,
} from "@/lib/api";
import { getApexSettings, type ApexSettings } from "@/lib/settingsStorage";
import {
  settingsTitle,
  settingsDescription,
  PRIMARY_RED,
  DELETE_CONFIRM_PHRASE,
  SESSION_VISIBILITY_OPTIONS,
} from "@/features/settings/constants";
import { formatCreatedAt, formatRetryAfterMs } from "@/features/settings/utils";
import { useSettingsForms } from "@/features/settings/hooks/useSettingsForms";
import {
  useApexFromServerUserEffect,
  useDeleteAccountFormOnDialogEffect,
  useDisplayNameFormResetEffect,
  usePersistApexToStorageEffect,
} from "@/features/settings/hooks/useSettingsUserEffects";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  type SettingsDisplayNameValues,
  type SettingsChangePasswordValues,
  type DeleteAccountFormValues,
  settingsDisplayNameSchema,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from "@/lib/validation/settingsForms";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import PageMeta from "@/components/PageMeta";
import SettingsAccountSectionV2 from "./settings/SettingsAccountSectionV2";
import SettingsPrivacySectionV2 from "./settings/SettingsPrivacySectionV2";
import SettingsDeleteDialogV2 from "./settings/SettingsDeleteDialogV2";
import SettingsPasswordSectionV2 from "./settings/SettingsPasswordSectionV2";
import SettingsNotificationsSectionV2 from "./settings/SettingsNotificationsSectionV2";
import SettingsAccountActionsSectionV2 from "./settings/SettingsAccountActionsSectionV2";
import { SettingsSectionChromeV2 } from "./settings/SettingsSectionChromeV2";
import { SubscriptionCardV2 } from "./settings/SubscriptionCardV2";

const SETTINGS_V2_PATH = "/v2/settings";

export default function SettingsV2() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, setUser } = useAuth();

  const [settings, setSettings] = useState<ApexSettings>(() =>
    getApexSettings(),
  );
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);
  const [changePwSubmitting, setChangePwSubmitting] = useState(false);
  const [changePwSuccess, setChangePwSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<DataExportFormat>("xlsx");
  const [privacySaving, setPrivacySaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);

  const { displayNameForm, changePasswordForm, deleteAccountForm } =
    useSettingsForms(DELETE_CONFIRM_PHRASE);

  useDisplayNameFormResetEffect(user, displayNameForm);
  useApexFromServerUserEffect(user, setSettings);
  useDeleteAccountFormOnDialogEffect(deleteDialogOpen, deleteAccountForm);

  const currentDisplayName =
    (user as { displayName?: string })?.displayName ?? user?.email ?? "";
  const displayNameWatch = displayNameForm.watch("displayName");
  const trimmedDisplayName = displayNameWatch.trim();
  const displayNameChanged = trimmedDisplayName !== currentDisplayName;
  const displayNameValid = settingsDisplayNameSchema.safeParse({
    displayName: displayNameWatch,
  }).success;
  const saveDisplayNameDisabled =
    !displayNameValid || !displayNameChanged || savingDisplayName;

  const onSaveDisplayName = useCallback(
    async (values: SettingsDisplayNameValues) => {
      const trimmed = values.displayName.trim();
      if (trimmed === currentDisplayName || savingDisplayName) return;
      displayNameForm.clearErrors("root");
      setDisplayNameSuccess(false);
      setSavingDisplayName(true);
      if (user) {
        setUser({ ...user, displayName: trimmed });
      }
      try {
        const updated = await updateMe({ displayName: trimmed });
        setUser(updated);
        setDisplayNameSuccess(true);
        setTimeout(() => setDisplayNameSuccess(false), 2000);
      } catch (e) {
        displayNameForm.setError("root", {
          type: "server",
          message:
            e instanceof Error ? e.message : "Failed to save display name.",
        });
      } finally {
        setSavingDisplayName(false);
      }
    },
    [currentDisplayName, savingDisplayName, setUser, user, displayNameForm],
  );

  usePersistApexToStorageEffect(settings);

  const applyNotificationToggle = useCallback(
    async (
      key: "emailNotifications" | "showNotificationBadge",
      value: boolean,
    ) => {
      const prev = settings[key];
      setSettings((s) => ({ ...s, [key]: value }));
      setNotificationSaving(true);
      try {
        const updated = await patchNotificationSettings({ [key]: value });
        setSettings((s) => ({
          ...s,
          emailNotifications: updated.emailNotifications,
          showNotificationBadge: updated.showNotificationBadge,
        }));
        if (user) {
          setUser({
            ...user,
            emailNotifications: updated.emailNotifications,
            showNotificationBadge: updated.showNotificationBadge,
          });
        }
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Record<string, unknown>),
            emailNotifications: updated.emailNotifications,
            showNotificationBadge: updated.showNotificationBadge,
          };
        });
      } catch (e) {
        setSettings((s) => ({ ...s, [key]: prev }));
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not save notification settings.";
        toast.error(msg);
      } finally {
        setNotificationSaving(false);
      }
    },
    [queryClient, setUser, settings, user],
  );

  const handleResetNotificationDefaults = useCallback(async () => {
    setNotificationSaving(true);
    try {
      const updated = await patchNotificationSettings({
        emailNotifications: true,
        showNotificationBadge: true,
      });
      setSettings((s) => ({
        ...s,
        emailNotifications: updated.emailNotifications,
        showNotificationBadge: updated.showNotificationBadge,
      }));
      if (user) {
        setUser({
          ...user,
          emailNotifications: updated.emailNotifications,
          showNotificationBadge: updated.showNotificationBadge,
        });
      }
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return {
          ...(old as Record<string, unknown>),
          emailNotifications: updated.emailNotifications,
          showNotificationBadge: updated.showNotificationBadge,
        };
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not reset notification settings.";
      toast.error(msg);
    } finally {
      setNotificationSaving(false);
    }
  }, [queryClient, setUser, user]);

  const applyPrivacyToggle = useCallback(
    async (key: "privateProfile" | "manualFollowApproval", value: boolean) => {
      const prev = settings[key];
      setSettings((s) => ({ ...s, [key]: value }));
      setPrivacySaving(true);
      try {
        const updated = await patchPrivacySettings({ [key]: value });
        setSettings((s) => ({ ...s, ...updated }));
        if (user) {
          setUser({
            ...user,
            privateProfile: updated.privateProfile,
            manualFollowApproval: updated.manualFollowApproval,
            sessionVisibility: updated.sessionVisibility,
          });
        }
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Record<string, unknown>),
            privateProfile: updated.privateProfile,
            manualFollowApproval: updated.manualFollowApproval,
            sessionVisibility: updated.sessionVisibility,
          };
        });
      } catch (e) {
        setSettings((s) => ({ ...s, [key]: prev }));
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not save privacy settings.";
        toast.error(msg);
      } finally {
        setPrivacySaving(false);
      }
    },
    [queryClient, setUser, settings, user],
  );

  const applySessionVisibility = useCallback(
    async (value: SessionVisibility) => {
      const prev = settings.sessionVisibility;
      setSettings((s) => ({ ...s, sessionVisibility: value }));
      setPrivacySaving(true);
      try {
        const updated = await patchPrivacySettings({
          sessionVisibility: value,
        });
        setSettings((s) => ({ ...s, ...updated }));
        if (user) {
          setUser({
            ...user,
            privateProfile: updated.privateProfile,
            manualFollowApproval: updated.manualFollowApproval,
            sessionVisibility: updated.sessionVisibility,
          });
        }
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Record<string, unknown>),
            privateProfile: updated.privateProfile,
            manualFollowApproval: updated.manualFollowApproval,
            sessionVisibility: updated.sessionVisibility,
          };
        });
      } catch (e) {
        setSettings((s) => ({ ...s, sessionVisibility: prev }));
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not save privacy settings.";
        toast.error(msg);
      } finally {
        setPrivacySaving(false);
      }
    },
    [queryClient, setUser, settings.sessionVisibility, user],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // Server revoke is best-effort; always clear local credentials.
    }
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleExportData = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      await downloadUserDataExport({ format: exportFormat });
      toast.success("Your data export has downloaded.");
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 429 && e.retryAfterMs != null
          ? `You can export again in ${formatRetryAfterMs(e.retryAfterMs)}.`
          : e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not export data.";
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [exportFormat, exportLoading]);

  const resetDeleteDialog = useCallback(() => {
    deleteAccountForm.reset({ password: "", confirmPhrase: "" });
    deleteAccountForm.clearErrors("root");
  }, [deleteAccountForm]);

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      setDeleteDialogOpen(open);
      if (!open) resetDeleteDialog();
    },
    [resetDeleteDialog],
  );

  const onConfirmDeleteAccount = useCallback(
    async (values: DeleteAccountFormValues) => {
      if (deleteSubmitting) return;
      deleteAccountForm.clearErrors("root");
      setDeleteSubmitting(true);
      try {
        await deleteAccount(values.password);
        clearToken();
        setUser(null);
        setDeleteDialogOpen(false);
        resetDeleteDialog();
        navigate("/login", { replace: true });
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not delete account.";
        deleteAccountForm.setError("root", { type: "server", message: msg });
      } finally {
        setDeleteSubmitting(false);
      }
    },
    [deleteAccountForm, deleteSubmitting, navigate, resetDeleteDialog, setUser],
  );

  const changePwWatch = changePasswordForm.watch();
  const trimmedNewPw = changePwWatch.newPassword?.trim() ?? "";
  const currentPasswordValid = (changePwWatch.currentPassword?.length ?? 0) > 0;
  const newPasswordValid =
    trimmedNewPw.length >= PASSWORD_MIN && trimmedNewPw.length <= PASSWORD_MAX;
  const newPasswordTooLong = trimmedNewPw.length > PASSWORD_MAX;
  const passwordsSameAsCurrent =
    changePwWatch.currentPassword?.trim() === trimmedNewPw &&
    trimmedNewPw.length > 0;
  const updatePasswordDisabled =
    !currentPasswordValid ||
    !newPasswordValid ||
    passwordsSameAsCurrent ||
    changePwSubmitting;

  const onChangePassword = useCallback(
    async (values: SettingsChangePasswordValues) => {
      if (changePwSubmitting) return;
      const trimmedNew = values.newPassword.trim();
      changePasswordForm.clearErrors("root");
      setChangePwSuccess(false);
      setChangePwSubmitting(true);
      try {
        await changePassword(values.currentPassword, trimmedNew);
        changePasswordForm.reset({ currentPassword: "", newPassword: "" });
        setChangePwSuccess(true);
        setTimeout(() => setChangePwSuccess(false), 2500);
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not update password.";
        changePasswordForm.setError("root", { type: "server", message: msg });
      } finally {
        setChangePwSubmitting(false);
      }
    },
    [changePasswordForm, changePwSubmitting],
  );

  const handlePasswordFieldChange = useCallback(() => {
    changePasswordForm.clearErrors("root");
    setChangePwSuccess(false);
  }, [changePasswordForm]);

  const handleManageFollowRequests = useCallback(() => {
    window.dispatchEvent(new CustomEvent("apex:open-notifications"));
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta
          title={settingsTitle}
          description={settingsDescription}
          path={SETTINGS_V2_PATH}
          noindex
        />
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <SkeletonBlock
            height={36}
            width={220}
            className="mb-4 rounded bg-v2-surface-container-highest"
          />
          <SkeletonBlock
            height={16}
            width={320}
            className="mb-10 rounded bg-v2-surface-container-highest"
          />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <SkeletonBlock
                height={200}
                className="rounded-v2-lg bg-v2-surface-container-highest"
              />
              <SkeletonBlock
                height={280}
                className="rounded-v2-lg bg-v2-surface-container-highest"
              />
            </div>
            <div className="space-y-8 lg:col-span-5">
              <SkeletonBlock
                height={160}
                className="rounded-v2-lg bg-v2-surface-container-highest"
              />
              <SkeletonBlock
                height={200}
                className="rounded-v2-lg bg-v2-surface-container-highest"
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta
          title={settingsTitle}
          description={settingsDescription}
          path={SETTINGS_V2_PATH}
          noindex
        />
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm rounded-v2-lg bg-v2-surface-container-low p-6 text-center">
            <p className="mb-2 font-v2-headline font-bold text-v2-on-surface">
              Not signed in
            </p>
            <p className="mb-4 text-sm text-v2-on-surface-variant">
              Sign in to manage your settings.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className={v2PrimaryButtonClassName}
              style={{ backgroundColor: PRIMARY_RED }}
            >
              Log in
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={settingsTitle}
        description={settingsDescription}
        path={SETTINGS_V2_PATH}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="mb-10">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Driver Settings
          </h1>
          <p className="mt-2 text-sm tracking-wide text-v2-on-surface-variant">
            Configure your kinetic profile and telemetry preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <SettingsAccountSectionV2
              user={user}
              displayNameForm={displayNameForm}
              onSaveDisplayName={onSaveDisplayName}
              saveDisabled={saveDisplayNameDisabled}
              saving={savingDisplayName}
              success={displayNameSuccess}
              formatCreatedAt={formatCreatedAt}
            />

            <SettingsPrivacySectionV2
              settings={settings}
              privacySaving={privacySaving}
              applyPrivacyToggle={applyPrivacyToggle}
              applySessionVisibility={applySessionVisibility}
              sessionVisibilityOptions={SESSION_VISIBILITY_OPTIONS}
              onManageFollowRequests={handleManageFollowRequests}
            />

            <SettingsNotificationsSectionV2
              settings={settings}
              notificationSaving={notificationSaving}
              applyNotificationToggle={applyNotificationToggle}
              onResetDefaults={handleResetNotificationDefaults}
            />
          </div>

          <div className="space-y-10 lg:col-span-5">
            <SettingsSectionChromeV2 title="Subscription">
              <SubscriptionCardV2 />
            </SettingsSectionChromeV2>

            <SettingsPasswordSectionV2
              changePasswordForm={changePasswordForm}
              onChangePassword={onChangePassword}
              changePwWatch={changePwWatch}
              trimmedNewPw={trimmedNewPw}
              currentPasswordValid={currentPasswordValid}
              newPasswordValid={newPasswordValid}
              newPasswordTooLong={newPasswordTooLong}
              passwordsSameAsCurrent={passwordsSameAsCurrent}
              updatePasswordDisabled={updatePasswordDisabled}
              changePwSubmitting={changePwSubmitting}
              changePwSuccess={changePwSuccess}
              onFieldChange={handlePasswordFieldChange}
            />

            <SettingsAccountActionsSectionV2
              exportFormat={exportFormat}
              onExportFormatChange={setExportFormat}
              exportLoading={exportLoading}
              onExportData={handleExportData}
              onLogout={handleLogout}
              onDeleteAccount={() => setDeleteDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      <SettingsDeleteDialogV2
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        deleteAccountForm={deleteAccountForm}
        onConfirm={onConfirmDeleteAccount}
        submitting={deleteSubmitting}
        deleteConfirmPhrase={DELETE_CONFIRM_PHRASE}
      />
    </>
  );
}
