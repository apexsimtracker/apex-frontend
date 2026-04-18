import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import { clearToken } from "@/auth/token";
import {
  authMe,
  updateMe,
  API_BASE,
  changePassword,
  deleteAccount,
  ApiError,
  patchPrivacySettings,
} from "@/lib/api";
import {
  getApexSettings,
  setApexSettings,
  resetApexSettings,
  type ApexSettings,
} from "@/lib/settingsStorage";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { WithRootError } from "@/lib/formWithRootError";
import {
  settingsDisplayNameSchema,
  settingsChangePasswordSchema,
  deleteAccountSchema,
  type SettingsDisplayNameValues,
  type SettingsChangePasswordValues,
  type DeleteAccountFormValues,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from "@/lib/validation/settingsForms";
import { cn } from "@/lib/utils";
import { RefreshCw, LogOut, Trash2, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

const SETTINGS_PATH = "/settings";
const settingsTitle = `Settings | ${COMPANY_NAME}`;
const settingsDescription = `Account, password, preferences, and privacy settings for your ${COMPANY_NAME} profile at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

const PRIMARY_RED = "rgb(240, 28, 28)";
const DELETE_CONFIRM_PHRASE = "DELETE";

function SettingsCard({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6",
        className
      )}
    >
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  try {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, setUser } = useAuth();

  const [settings, setSettings] = useState<ApexSettings>(() => getApexSettings());
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);
  const [changePwSubmitting, setChangePwSubmitting] = useState(false);
  const [changePwSuccess, setChangePwSuccess] = useState(false);
  const [testApiStatus, setTestApiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testApiMessage, setTestApiMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  const displayNameForm = useForm<WithRootError<SettingsDisplayNameValues>>({
    resolver: zodResolver(settingsDisplayNameSchema),
    defaultValues: { displayName: "" },
    mode: "onChange",
  });

  const changePasswordForm = useForm<WithRootError<SettingsChangePasswordValues>>({
    resolver: zodResolver(settingsChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const deleteAccountForm = useForm<WithRootError<DeleteAccountFormValues>>({
    resolver: zodResolver(deleteAccountSchema(DELETE_CONFIRM_PHRASE)),
    defaultValues: { password: "", confirmPhrase: "" },
  });

  useEffect(() => {
    if (user) {
      displayNameForm.reset({
        displayName: (user as { displayName?: string }).displayName ?? user.email ?? "",
      });
    }
  }, [user, displayNameForm]);

  useEffect(() => {
    if (!user) return;
    const u = user as {
      privateProfile?: boolean;
      manualFollowApproval?: boolean;
      showRaceHistory?: boolean;
    };
    setSettings((prev) => ({
      ...prev,
      ...(typeof u.privateProfile === "boolean" ? { privateProfile: u.privateProfile } : {}),
      ...(typeof u.manualFollowApproval === "boolean"
        ? { manualFollowApproval: u.manualFollowApproval }
        : {}),
      ...(typeof u.showRaceHistory === "boolean" ? { showRaceHistory: u.showRaceHistory } : {}),
    }));
  }, [
    user?.id,
    user?.privateProfile,
    user?.manualFollowApproval,
    user?.showRaceHistory,
  ]);

  useEffect(() => {
    if (deleteDialogOpen) {
      deleteAccountForm.reset({ password: "", confirmPhrase: "" });
    }
  }, [deleteDialogOpen, deleteAccountForm]);

  const currentDisplayName = (user as { displayName?: string })?.displayName ?? user?.email ?? "";
  const displayNameWatch = displayNameForm.watch("displayName");
  const trimmedDisplayName = displayNameWatch.trim();
  const displayNameChanged = trimmedDisplayName !== currentDisplayName;
  const displayNameValid = settingsDisplayNameSchema.safeParse({ displayName: displayNameWatch }).success;
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
          message: e instanceof Error ? e.message : "Failed to save display name.",
        });
      } finally {
        setSavingDisplayName(false);
      }
    },
    [currentDisplayName, savingDisplayName, setUser, user, displayNameForm]
  );

  useEffect(() => {
    setApexSettings(settings);
  }, [settings]);

  const handleToggle = useCallback((key: keyof ApexSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPrivacyToggle = useCallback(
    async (
      key: "privateProfile" | "manualFollowApproval" | "showRaceHistory",
      value: boolean
    ) => {
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
            showRaceHistory: updated.showRaceHistory,
          });
        }
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Record<string, unknown>),
            privateProfile: updated.privateProfile,
            manualFollowApproval: updated.manualFollowApproval,
            showRaceHistory: updated.showRaceHistory,
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
    [queryClient, setUser, settings, user]
  );

  const handleResetDefaults = useCallback(() => {
    setSettings(resetApexSettings());
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

  const resetDeleteDialog = useCallback(() => {
    deleteAccountForm.reset({ password: "", confirmPhrase: "" });
    deleteAccountForm.clearErrors("root");
  }, [deleteAccountForm]);

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      setDeleteDialogOpen(open);
      if (!open) resetDeleteDialog();
    },
    [resetDeleteDialog]
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
    [deleteAccountForm, deleteSubmitting, navigate, resetDeleteDialog, setUser]
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
    changePwWatch.currentPassword?.trim() === trimmedNewPw && trimmedNewPw.length > 0;
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
    [changePasswordForm, changePwSubmitting]
  );
  /** Only for local/dev builds — never expose API host / connectivity test in production. */
  const showDevSystemStatus = import.meta.env.DEV;
  const envLabel = import.meta.env.MODE === "production" ? "production" : "development";
  const apiHost = (() => {
    try {
      return new URL(API_BASE).host;
    } catch {
      return API_BASE;
    }
  })();

  if (loading) {
    return (
      <>
        <PageMeta title={settingsTitle} description={settingsDescription} path={SETTINGS_PATH} />
        <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <SkeletonBlock height={32} width={180} className="mb-8 rounded" />
          <div className="space-y-6">
            <SkeletonBlock height={120} className="rounded-xl" />
            <SkeletonBlock height={200} className="rounded-xl" />
            <SkeletonBlock height={160} className="rounded-xl" />
          </div>
        </div>
      </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta title={settingsTitle} description={settingsDescription} path={SETTINGS_PATH} />
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-card/50 p-6 text-center">
          <p className="mb-2 font-medium text-foreground">Not signed in</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Sign in to manage your settings.
          </p>
          <Button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="text-white focus-visible:ring-ring"
            style={{ backgroundColor: PRIMARY_RED }}
          >
            Log in
          </Button>
        </div>
      </div>
      </>
    );
  }

  const displayName = (user as { displayName?: string }).displayName ?? user.email ?? "";
  const createdAt = (user as { createdAt?: string }).createdAt;

  return (
    <>
      <PageMeta title={settingsTitle} description={settingsDescription} path={SETTINGS_PATH} />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="mb-8 text-2xl font-bold text-foreground sm:text-3xl">
          Settings
        </h1>

        <div className="space-y-6">
          {/* Profile / Account info */}
          <SettingsCard title="Account" description="Your account details from the server.">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Display name</span>
                <p className="mt-0.5 font-medium text-foreground">{displayName || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="mt-0.5 font-medium text-foreground">{user.email ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Member since</span>
                <p className="mt-0.5 font-medium text-foreground">{formatCreatedAt(createdAt)}</p>
              </div>
            </div>
          </SettingsCard>

          {/* Display name (editable, Save → PATCH /api/auth/me) */}
          <SettingsCard
            title="Display name"
            description="Update your display name (2–40 characters)."
          >
            <Form {...displayNameForm}>
              <form
                onSubmit={displayNameForm.handleSubmit(onSaveDisplayName)}
                className="flex flex-col gap-2"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <FormField
                    control={displayNameForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem className="min-w-0 flex-1">
                        <FormControl>
                          <Input
                            placeholder="Display name"
                            disabled={savingDisplayName}
                            className="rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              displayNameForm.clearErrors("root");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={saveDisplayNameDisabled}
                    className="sm:w-auto"
                    style={saveDisplayNameDisabled ? undefined : { backgroundColor: PRIMARY_RED }}
                  >
                    {savingDisplayName ? "Saving…" : "Save"}
                  </Button>
                </div>
                <FormRootMessage className="mt-0 text-xs" />
              </form>
            </Form>
            {displayNameSuccess && (
              <p className="mt-2 text-xs text-green-500">Saved</p>
            )}
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard
            title="Notifications"
            description="Manage how you receive updates. Stored locally for now."
          >
            <div className="-mx-1 divide-y divide-white/5">
              <SettingsRow
                label="Email notifications"
                description="Updates via email"
              >
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => handleToggle("emailNotifications", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Push notifications"
                description="Browser notifications"
              >
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(v) => handleToggle("pushNotifications", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Activity notifications"
                description="When friends race"
              >
                <Switch
                  checked={settings.activityNotifications}
                  onCheckedChange={(v) => handleToggle("activityNotifications", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Leaderboard notifications"
                description="Rank changes"
              >
                <Switch
                  checked={settings.leaderboardNotifications}
                  onCheckedChange={(v) => handleToggle("leaderboardNotifications", v)}
                />
              </SettingsRow>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleResetDefaults}
            >
              Reset to defaults
            </Button>
          </SettingsCard>

          {/* Privacy */}
          <SettingsCard title="Privacy" description="Control what others can see.">
            <div className="-mx-1 divide-y divide-white/5">
              <SettingsRow
                label="Private profile"
                description="Only approved followers can view your stats, sessions, and race history."
              >
                <Switch
                  checked={settings.privateProfile}
                  disabled={privacySaving}
                  onCheckedChange={(v) => void applyPrivacyToggle("privateProfile", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Manual follow approval"
                description={
                  settings.privateProfile
                    ? "When on, people send a follow request you approve in notifications or below."
                    : "Turn on Private profile to require follow requests."
                }
              >
                <Switch
                  checked={settings.manualFollowApproval}
                  disabled={!settings.privateProfile || privacySaving}
                  onCheckedChange={(v) => void applyPrivacyToggle("manualFollowApproval", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Show race history"
                description="Let approved viewers see your race history (when they can view your profile)."
              >
                <Switch
                  checked={settings.showRaceHistory}
                  disabled={privacySaving}
                  onCheckedChange={(v) => void applyPrivacyToggle("showRaceHistory", v)}
                />
              </SettingsRow>
            </div>
            {user ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.dispatchEvent(new CustomEvent("apex:open-notifications"))}
              >
                Manage follow requests
              </Button>
            ) : null}
          </SettingsCard>

          <SettingsCard
            id="change-password"
            title="Security"
            description="Enter your current password and a new password (8–200 characters)."
          >
            <Form {...changePasswordForm}>
              <form
                onSubmit={changePasswordForm.handleSubmit(onChangePassword)}
                className="max-w-xs space-y-3"
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
                          className="w-full rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
                          <p className="text-xs text-amber-500">Current password is required.</p>
                        )}
                      <FormMessage className="text-xs" />
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
                          className="w-full rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
                            New password must be at least {PASSWORD_MIN} characters.
                          </p>
                        )}
                      {newPasswordTooLong && (
                        <p className="text-xs text-amber-500">
                          New password must be at most {PASSWORD_MAX} characters.
                        </p>
                      )}
                      {passwordsSameAsCurrent && newPasswordValid && currentPasswordValid && (
                        <p className="text-xs text-amber-500">
                          New password must be different from your current password.
                        </p>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormRootMessage className="text-xs" />
                {changePwSuccess && (
                  <p className="text-xs text-green-500">Password updated.</p>
                )}
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={updatePasswordDisabled}
                  aria-busy={changePwSubmitting}
                  className={updatePasswordDisabled ? "cursor-not-allowed opacity-60" : undefined}
                >
                  {changePwSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </Form>
          </SettingsCard>

          {/* Account – Log out + Delete */}
          <SettingsCard title="Account actions" description="Log out or delete your account.">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/20 text-foreground hover:bg-white/10 sm:w-auto"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4" />
                Log out
              </Button>
              <div className="border-t border-white/5 pt-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Permanently remove access and anonymize your personal data on our servers. Your
                  public posts may remain with the label &quot;Deleted User.&quot; This cannot be
                  undone.
                </p>
                <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete account
                  </Button>
                  <AlertDialogContent className="border-white/10 bg-card sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete account</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3 text-left">
                        <span className="block">
                          This will sign you out everywhere, revoke sessions, and anonymize your
                          email, password, name, avatar, and bio. You will not be able to sign in
                          again with this account.
                        </span>
                        <span className="block font-medium text-foreground">
                          Type {DELETE_CONFIRM_PHRASE} below to confirm.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...deleteAccountForm}>
                      <form
                        onSubmit={deleteAccountForm.handleSubmit(onConfirmDeleteAccount)}
                        className="space-y-3 py-2"
                      >
                        <FormField
                          control={deleteAccountForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="password"
                                  autoComplete="current-password"
                                  placeholder="Current password"
                                  disabled={deleteSubmitting}
                                  className="w-full rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    deleteAccountForm.clearErrors("root");
                                  }}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deleteAccountForm.control}
                          name="confirmPhrase"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="text"
                                  autoComplete="off"
                                  placeholder={`Type ${DELETE_CONFIRM_PHRASE}`}
                                  disabled={deleteSubmitting}
                                  className="w-full rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    deleteAccountForm.clearErrors("root");
                                  }}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormRootMessage className="text-xs" />
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel
                            type="button"
                            disabled={deleteSubmitting}
                            className="border-white/20"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            type="submit"
                            variant="destructive"
                            disabled={deleteSubmitting}
                            className={deleteSubmitting ? "cursor-not-allowed opacity-60" : undefined}
                          >
                            {deleteSubmitting ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                                Deleting…
                              </>
                            ) : (
                              "Delete permanently"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </form>
                    </Form>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SettingsCard>

          {showDevSystemStatus && (
            <SettingsCard
              title="System status"
              description="Environment and API connectivity (developers only)."
            >
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Environment:</span>{" "}
                  <span className="text-foreground">{envLabel}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">API host:</span>{" "}
                  <span className="font-mono text-xs text-foreground">{apiHost}</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestApi}
                    disabled={testApiStatus === "loading"}
                  >
                    {testApiStatus === "loading" ? (
                      "Testing…"
                    ) : (
                      <>
                        <RefreshCw className="mr-1.5 size-3.5" />
                        Test API
                      </>
                    )}
                  </Button>
                  {testApiStatus === "success" && (
                    <span className="text-xs text-green-500">{testApiMessage}</span>
                  )}
                  {testApiStatus === "error" && (
                    <span className="text-xs text-destructive">{testApiMessage}</span>
                  )}
                </div>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
