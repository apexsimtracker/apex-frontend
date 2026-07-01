import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Loader2,
  LogOut,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import { clearToken } from "@/auth/token";
import {
  authMe,
  authLogout,
  updateMe,
  getApiBase,
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
import { SettingsRow } from "@/features/settings/components/SettingsRow";
import { SubscriptionCard } from "@/features/settings/components/SubscriptionCard";
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
import { Switch } from "@/components/ui/switch";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type SettingsDisplayNameValues,
  type SettingsChangePasswordValues,
  type DeleteAccountFormValues,
  settingsDisplayNameSchema,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from "@/lib/validation/settingsForms";
import { authPrimarySolidButtonClassName } from "@/lib/authUi";
import { cn } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import SettingsAccountSectionV2 from "./settings/SettingsAccountSectionV2";
import SettingsPrivacySectionV2 from "./settings/SettingsPrivacySectionV2";
import SettingsDeleteDialogV2 from "./settings/SettingsDeleteDialogV2";
import { SettingsSectionChromeV2 } from "./settings/SettingsSectionChromeV2";

const SETTINGS_V2_PATH = "/v2/settings";

const v2InputClassName =
  "w-full rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-highest px-3 py-2 text-sm text-v2-on-surface placeholder:text-v2-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-v2-primary disabled:opacity-50";

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
  const [testApiStatus, setTestApiStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testApiMessage, setTestApiMessage] = useState("");
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

  const handleTestApi = useCallback(async () => {
    setTestApiStatus("loading");
    setTestApiMessage("");
    try {
      await authMe();
      setTestApiStatus("success");
      setTestApiMessage("API is reachable.");
    } catch (e) {
      setTestApiStatus("error");
      setTestApiMessage(e instanceof Error ? e.message : "Request failed.");
    }
  }, []);

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

  const showDevSystemStatus =
    import.meta.env.VITE_ENABLE_DEV_SYSTEM_STATUS === "true";
  const envLabel =
    import.meta.env.MODE === "production" ? "production" : "development";
  const apiHost = (() => {
    try {
      return new URL(getApiBase()).host;
    } catch {
      return getApiBase();
    }
  })();

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
                className="rounded-lg bg-v2-surface-container-highest"
              />
              <SkeletonBlock
                height={280}
                className="rounded-lg bg-v2-surface-container-highest"
              />
            </div>
            <div className="space-y-8 lg:col-span-5">
              <SkeletonBlock
                height={160}
                className="rounded-lg bg-v2-surface-container-highest"
              />
              <SkeletonBlock
                height={200}
                className="rounded-lg bg-v2-surface-container-highest"
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
          <div className="v2-kinetic-glass w-full max-w-sm rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6 text-center">
            <p className="mb-2 font-v2-headline font-bold text-v2-on-surface">
              Not signed in
            </p>
            <p className="mb-4 font-v2-body text-sm text-v2-on-surface-variant">
              Sign in to manage your settings.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="text-white focus-visible:ring-v2-primary"
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
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="mb-10">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Driver Settings
          </h1>
          <p className="mt-2 font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
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

            <SettingsSectionChromeV2 title="Password & security">
              <p className="mb-4 font-v2-body text-xs text-v2-on-surface-variant">
                Enter your current password and a new password ({PASSWORD_MIN}–
                {PASSWORD_MAX} characters).
              </p>
              <Form {...changePasswordForm}>
                <form
                  id="change-password"
                  onSubmit={changePasswordForm.handleSubmit(onChangePassword)}
                  className="max-w-md space-y-3"
                >
                  <FormField
                    control={changePasswordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            placeholder="Current password"
                            disabled={changePwSubmitting}
                            className={v2InputClassName}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              changePasswordForm.clearErrors("root");
                              setChangePwSuccess(false);
                            }}
                          />
                        </FormControl>
                        {!currentPasswordValid &&
                          changePwWatch.currentPassword?.length === 0 &&
                          (changePwWatch.newPassword?.length ?? 0) > 0 && (
                            <p className="text-xs text-amber-500">
                              Current password is required.
                            </p>
                          )}
                        <FormMessage className="text-xs text-v2-error" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={changePasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="New password"
                            disabled={changePwSubmitting}
                            className={v2InputClassName}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              changePasswordForm.clearErrors("root");
                              setChangePwSuccess(false);
                            }}
                          />
                        </FormControl>
                        {(changePwWatch.newPassword?.length ?? 0) > 0 &&
                          trimmedNewPw.length < PASSWORD_MIN && (
                            <p className="text-xs text-amber-500">
                              New password must be at least {PASSWORD_MIN}{" "}
                              characters.
                            </p>
                          )}
                        {newPasswordTooLong && (
                          <p className="text-xs text-amber-500">
                            New password must be at most {PASSWORD_MAX}{" "}
                            characters.
                          </p>
                        )}
                        {passwordsSameAsCurrent &&
                          newPasswordValid &&
                          currentPasswordValid && (
                            <p className="text-xs text-amber-500">
                              New password must be different from your current
                              password.
                            </p>
                          )}
                        <FormMessage className="text-xs text-v2-error" />
                      </FormItem>
                    )}
                  />
                  <FormRootMessage className="text-xs text-v2-error" />
                  {changePwSuccess && (
                    <p className="text-xs text-v2-success">Password updated.</p>
                  )}
                  <Button
                    type="submit"
                    variant="default"
                    disabled={updatePasswordDisabled}
                    aria-busy={changePwSubmitting}
                    className={cn(
                      authPrimarySolidButtonClassName,
                      updatePasswordDisabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {changePwSubmitting ? (
                      <>
                        <Loader2
                          className="mr-2 size-4 animate-spin"
                          aria-hidden
                        />
                        Updating…
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </Form>
            </SettingsSectionChromeV2>
          </div>

          <div className="space-y-10 lg:col-span-5">
            <section className="v2-red-accent-border pl-6">
              <h2 className="mb-4 font-v2-headline text-[10px] uppercase tracking-[0.2em] text-v2-on-surface-variant">
                Subscription
              </h2>
              <div className="v2-kinetic-glass rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-2">
                <SubscriptionCard />
              </div>
            </section>

            <SettingsSectionChromeV2 title="Notifications">
              <p className="mb-4 font-v2-body text-xs text-v2-on-surface-variant">
                Preferences are saved to your account. Security emails
                (verification, password reset) always send.
              </p>
              <div className="-mx-1 divide-y divide-v2-outline-variant/10">
                <SettingsRow
                  label="Email notifications"
                  description="Optional updates and announcements by email. Does not affect verification, password reset, or Pro welcome emails."
                >
                  <Switch
                    checked={settings.emailNotifications}
                    disabled={notificationSaving}
                    onCheckedChange={(v) =>
                      void applyNotificationToggle("emailNotifications", v)
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="In-app notification alerts"
                  description="Unread count on the bell in the navigation bar. You can still open notifications and follow requests when this is off."
                >
                  <Switch
                    checked={settings.showNotificationBadge}
                    disabled={notificationSaving}
                    onCheckedChange={(v) =>
                      void applyNotificationToggle("showNotificationBadge", v)
                    }
                  />
                </SettingsRow>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-v2-surface-variant mt-4 border-v2-outline-variant/20 text-v2-on-surface"
                disabled={notificationSaving}
                onClick={() => void handleResetNotificationDefaults()}
              >
                Reset to defaults
              </Button>
            </SettingsSectionChromeV2>

            <SettingsSectionChromeV2 title="Account actions">
              <div className="space-y-4">
                <div className="rounded-lg bg-v2-surface-container-low p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-v2-headline font-bold text-v2-on-surface">
                      Export data
                    </h3>
                    <Download
                      className="size-5 text-v2-on-surface-variant"
                      aria-hidden
                    />
                  </div>
                  <Label
                    htmlFor="v2-export-format"
                    className="mb-1.5 block font-v2-body text-[10px] uppercase text-v2-on-surface-variant"
                  >
                    File format
                  </Label>
                  <select
                    id="v2-export-format"
                    value={exportFormat}
                    onChange={(e) =>
                      setExportFormat(e.target.value as DataExportFormat)
                    }
                    disabled={exportLoading}
                    className="mb-3 w-full rounded-md border border-v2-outline-variant/20 bg-v2-surface-container-highest px-4 py-3 font-v2-body text-sm text-v2-on-surface focus:outline-none focus:ring-1 focus:ring-v2-primary disabled:opacity-50"
                  >
                    <option value="xlsx">
                      Excel workbook (.xlsx) — full data
                    </option>
                    <option value="pdf">
                      Summary PDF (.pdf) — printable overview
                    </option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "hover:bg-v2-surface-variant w-full border-v2-outline-variant/20 text-v2-on-surface",
                      exportLoading && "cursor-not-allowed opacity-60",
                    )}
                    onClick={handleExportData}
                    disabled={exportLoading}
                    aria-busy={exportLoading}
                  >
                    {exportLoading ? (
                      <>
                        <Loader2
                          className="mr-2 size-4 animate-spin"
                          aria-hidden
                        />
                        Exporting…
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 size-4" aria-hidden />
                        Export data
                      </>
                    )}
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center justify-between rounded-lg bg-v2-surface-container-low p-6 transition-colors hover:bg-v2-surface-container"
                >
                  <span className="font-v2-headline font-bold text-v2-on-surface">
                    Log out
                  </span>
                  <LogOut
                    className="size-5 text-v2-on-surface-variant"
                    aria-hidden
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-v2-error/20 bg-v2-error/10 p-6 transition-colors hover:bg-v2-error/20"
                >
                  <div className="text-left">
                    <span className="block font-v2-headline font-bold text-v2-error">
                      Delete account
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-tighter text-v2-error/60">
                      This action is permanent and irreversible
                    </span>
                  </div>
                  <Trash2 className="size-5 text-v2-error" aria-hidden />
                </button>
              </div>
            </SettingsSectionChromeV2>

            {showDevSystemStatus && (
              <div className="v2-kinetic-glass rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Terminal className="size-5 text-v2-primary" aria-hidden />
                  <h4 className="font-v2-headline text-sm font-bold text-v2-primary">
                    System status
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between font-v2-body text-xs">
                    <span className="uppercase text-v2-on-surface-variant">
                      Environment
                    </span>
                    <span className="font-bold text-v2-primary">
                      {envLabel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between font-v2-body text-xs">
                    <span className="uppercase text-v2-on-surface-variant">
                      API host
                    </span>
                    <span className="font-mono font-bold text-v2-primary">
                      {apiHost}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-v2-outline-variant/20"
                      onClick={handleTestApi}
                      disabled={testApiStatus === "loading"}
                    >
                      {testApiStatus === "loading" ? (
                        "Testing…"
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
                          Test API
                        </>
                      )}
                    </Button>
                    {testApiStatus === "success" && (
                      <span className="text-xs text-v2-success">
                        {testApiMessage}
                      </span>
                    )}
                    {testApiStatus === "error" && (
                      <span className="text-xs text-v2-error">
                        {testApiMessage}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 h-1 w-full overflow-hidden bg-v2-surface-container-highest">
                    <div className="v2-primary-gradient h-full w-3/4 shadow-[0_0_8px_rgba(255,142,125,0.5)]" />
                  </div>
                </div>
              </div>
            )}
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
