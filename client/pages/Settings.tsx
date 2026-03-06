import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { clearToken } from "@/auth/token";
import { authMe, updateMe, API_BASE } from "@/lib/api";
import {
  getApexSettings,
  setApexSettings,
  resetApexSettings,
  type ApexSettings,
} from "@/lib/settingsStorage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw, LogOut, Trash2 } from "lucide-react";

const PRIMARY_RED = "rgb(240, 28, 28)";

function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
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
  const { user, loading, setUser } = useAuth();

  const [settings, setSettings] = useState<ApexSettings>(() => getApexSettings());
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);
  const [changePwCurrent, setChangePwCurrent] = useState("");
  const [changePwNew, setChangePwNew] = useState("");
  const [changePwError, setChangePwError] = useState<string | null>(null);
  const [testApiStatus, setTestApiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testApiMessage, setTestApiMessage] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayNameInput((user as { displayName?: string }).displayName ?? user.email ?? "");
    }
  }, [user]);

  const currentDisplayName = (user as { displayName?: string })?.displayName ?? user?.email ?? "";
  const trimmedDisplayName = displayNameInput.trim();
  const displayNameValid = trimmedDisplayName.length >= 2 && trimmedDisplayName.length <= 40;
  const displayNameChanged = trimmedDisplayName !== currentDisplayName;
  const saveDisplayNameDisabled = !displayNameValid || !displayNameChanged || savingDisplayName;

  const handleSaveDisplayName = useCallback(async () => {
    const trimmed = displayNameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 40 || trimmed === currentDisplayName || savingDisplayName) return;
    setDisplayNameError(null);
    setDisplayNameSuccess(false);
    setSavingDisplayName(true);
    // Update auth user immediately so the new name shows even if the request fails (e.g. connection lost).
    if (user) {
      setUser({ ...user, displayName: trimmed });
    }
    try {
      const updated = await updateMe({ displayName: trimmed });
      setUser(updated);
      setDisplayNameSuccess(true);
      setTimeout(() => setDisplayNameSuccess(false), 2000);
    } catch (e) {
      setDisplayNameError(e instanceof Error ? e.message : "Failed to save display name.");
    } finally {
      setSavingDisplayName(false);
    }
  }, [displayNameInput, currentDisplayName, savingDisplayName, setUser, user]);

  useEffect(() => {
    setApexSettings(settings);
  }, [settings]);

  const handleToggle = useCallback((key: keyof ApexSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSettings(resetApexSettings());
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

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

  const newPasswordValid = changePwNew.length >= 8;
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
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <SkeletonBlock height={32} width={180} className="mb-8 rounded" />
          <div className="space-y-6">
            <SkeletonBlock height={120} className="rounded-xl" />
            <SkeletonBlock height={200} className="rounded-xl" />
            <SkeletonBlock height={160} className="rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-xl border border-white/10 bg-card/50 p-6 text-center">
          <p className="text-foreground font-medium mb-2">Not signed in</p>
          <p className="text-sm text-muted-foreground mb-4">
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
    );
  }

  const displayName = (user as { displayName?: string }).displayName ?? user.email ?? "";
  const createdAt = (user as { createdAt?: string }).createdAt;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
          Settings
        </h1>

        <div className="space-y-6">
          {/* Profile / Account info */}
          <SettingsCard title="Account" description="Your account details from the server.">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Display name</span>
                <p className="text-foreground font-medium mt-0.5">{displayName || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="text-foreground font-medium mt-0.5">{user.email ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Member since</span>
                <p className="text-foreground font-medium mt-0.5">{formatCreatedAt(createdAt)}</p>
              </div>
            </div>
          </SettingsCard>

          {/* Display name (editable, Save → PATCH /api/auth/me) */}
          <SettingsCard
            title="Display name"
            description="Update your display name (2–40 characters)."
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => {
                  setDisplayNameInput(e.target.value);
                  setDisplayNameError(null);
                }}
                placeholder="Display name"
                disabled={savingDisplayName}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-white/10 bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm disabled:opacity-50"
              />
              <Button
                type="button"
                disabled={saveDisplayNameDisabled}
                onClick={handleSaveDisplayName}
                className="sm:w-auto"
                style={saveDisplayNameDisabled ? undefined : { backgroundColor: PRIMARY_RED }}
              >
                {savingDisplayName ? "Saving…" : "Save"}
              </Button>
            </div>
            {displayNameError && (
              <p className="text-xs text-destructive mt-2">{displayNameError}</p>
            )}
            {displayNameSuccess && (
              <p className="text-xs text-green-500 mt-2">Saved</p>
            )}
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard
            title="Notifications"
            description="Manage how you receive updates. Stored locally for now."
          >
            <div className="divide-y divide-white/5 -mx-1">
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
            <div className="divide-y divide-white/5 -mx-1">
              <SettingsRow
                label="Private profile"
                description="Visible to friends only"
              >
                <Switch
                  checked={settings.privateProfile}
                  onCheckedChange={(v) => handleToggle("privateProfile", v)}
                />
              </SettingsRow>
              <SettingsRow
                label="Show race history"
                description="Show your results publicly"
              >
                <Switch
                  checked={settings.showRaceHistory}
                  onCheckedChange={(v) => handleToggle("showRaceHistory", v)}
                />
              </SettingsRow>
            </div>
          </SettingsCard>

          {/* Security – Change password (Coming soon) */}
          <SettingsCard
            title="Security"
            description="Change your password. Not available yet."
          >
            <div className="space-y-3 max-w-xs">
              <input
                type="password"
                value={changePwCurrent}
                onChange={(e) => {
                  setChangePwCurrent(e.target.value);
                  setChangePwError(null);
                }}
                placeholder="Current password"
                disabled
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-background/80 text-foreground placeholder:text-muted-foreground text-sm disabled:opacity-50"
              />
              <input
                type="password"
                value={changePwNew}
                onChange={(e) => {
                  setChangePwNew(e.target.value);
                  setChangePwError(null);
                }}
                placeholder="New password (min 8 characters)"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-background/80 text-foreground placeholder:text-muted-foreground text-sm"
              />
              {!newPasswordValid && changePwNew.length > 0 && (
                <p className="text-xs text-amber-500">New password must be at least 8 characters.</p>
              )}
              {changePwError && (
                <p className="text-xs text-destructive">{changePwError}</p>
              )}
              <Button disabled title="Coming soon" variant="secondary" className="opacity-60 cursor-not-allowed">
                Update password
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
          </SettingsCard>

          {/* Account – Log out + Delete */}
          <SettingsCard title="Account actions" description="Log out or delete your account.">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-foreground hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-2">
                  Permanently delete your account and data. This cannot be undone.
                </p>
                <Button
                  type="button"
                  disabled
                  variant="destructive"
                  className="opacity-60 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          </SettingsCard>

          {/* System status */}
          <SettingsCard
            title="System status"
            description="Environment and API connectivity."
          >
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Environment:</span>{" "}
                <span className="text-foreground">{envLabel}</span>
              </p>
              <p>
                <span className="text-muted-foreground">API host:</span>{" "}
                <span className="text-foreground font-mono text-xs">{apiHost}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
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
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
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
        </div>
      </div>
    </div>
  );
}
