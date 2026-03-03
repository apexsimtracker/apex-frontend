import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { clearToken } from "@/auth/token";
import { authSignup, authLogin, authLogout, updateProfile, changePassword, deleteAccount, getSystemStatus, type SystemStatusResponse } from "@/lib/api";
import { APP_VERSION } from "@/lib/appConfig";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { RefreshCw, User, Key, Trash2 } from "lucide-react";

const DEFAULT_DISPLAY_NAME = "Alex Chen";
const DEFAULT_BIO = "Passionate sim racer from San Francisco";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Profile settings state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [activityNotifications, setActivityNotifications] = useState(true);
  const [leaderboardNotifications, setLeaderboardNotifications] =
    useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showRaceHistory, setShowRaceHistory] = useState(true);
  const [originalDisplayName, setOriginalDisplayName] =
    useState(DEFAULT_DISPLAY_NAME);
  const [originalBio, setOriginalBio] = useState(DEFAULT_BIO);

  // Auth form state
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile edit state (for logged-in users)
  const [editDisplayName, setEditDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // System status (GET /api/system/status)
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);
  const [systemStatusError, setSystemStatusError] = useState<string | null>(null);
  const fetchSystemStatus = useCallback(async () => {
    setSystemStatusLoading(true);
    setSystemStatusError(null);
    try {
      const data = await getSystemStatus();
      setSystemStatus(data);
    } catch {
      setSystemStatusError("Unable to load system status.");
      setSystemStatus(null);
    } finally {
      setSystemStatusLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  // Sync editDisplayName with user.displayName
  useEffect(() => {
    if (user?.displayName) {
      setEditDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("userSettings");
    if (saved) {
      const settings = JSON.parse(saved);
      setDisplayName(settings.displayName || DEFAULT_DISPLAY_NAME);
      setBio(settings.bio || DEFAULT_BIO);
      setEmailNotifications(settings.emailNotifications ?? true);
      setPushNotifications(settings.pushNotifications ?? true);
      setActivityNotifications(settings.activityNotifications ?? true);
      setLeaderboardNotifications(settings.leaderboardNotifications ?? false);
      setPrivateProfile(settings.privateProfile ?? false);
      setShowRaceHistory(settings.showRaceHistory ?? true);
      setOriginalDisplayName(settings.displayName || DEFAULT_DISPLAY_NAME);
      setOriginalBio(settings.bio || DEFAULT_BIO);
    } else {
      setDisplayName(DEFAULT_DISPLAY_NAME);
      setBio(DEFAULT_BIO);
    }
  }, []);

  const handleSave = () => {
    const settings = {
      displayName,
      bio,
      emailNotifications,
      pushNotifications,
      activityNotifications,
      leaderboardNotifications,
      privateProfile,
      showRaceHistory,
    };
    localStorage.setItem("userSettings", JSON.stringify(settings));
    setOriginalDisplayName(displayName);
    setOriginalBio(bio);
    console.log("Settings saved:", settings);
  };

  const handleCancel = () => {
    // Reset to original values
    setDisplayName(originalDisplayName);
    setBio(originalBio);
  };

  const handleAuthSubmit = async () => {
    const email = authEmail.trim();
    const password = authPassword;
    const name = authDisplayName.trim();

    if (!email || !isValidEmail(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (authTab === "signup" && password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    if (authTab === "login" && !password) {
      setAuthError("Please enter your password.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const userData =
        authTab === "signup"
          ? await authSignup(email, password, name || undefined)
          : await authLogin(email, password);
      setUser(userData);
      setAuthEmail("");
      setAuthPassword("");
      setAuthDisplayName("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Authentication failed.";
      setAuthError(msg.replace(/^(POST|GET) \/api\/auth\/\w+ failed: \d+ /, ""));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authLogout();
      setUser(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveProfile = async () => {
    const trimmed = editDisplayName.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
      setProfileError("Display name must be 2–32 characters.");
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const updatedUser = await updateProfile(trimmed);
      setUser(updatedUser);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save.";
      setProfileError(msg.replace(/^PATCH \/api\/settings\/profile failed: \d+ /, ""));
    } finally {
      setSavingProfile(false);
    }
  };

  const isProfileSaveDisabled = (() => {
    const trimmed = editDisplayName.trim();
    if (trimmed === user?.displayName) return true;
    if (trimmed.length < 2 || trimmed.length > 32) return true;
    return savingProfile;
  })();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) return;
    if (newPassword.length < 8) {
      setChangePasswordError("New password must be at least 8 characters.");
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(false);
    try {
      await changePassword(currentPassword, newPassword);
      setChangePasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setChangePasswordSuccess(false), 3000);
    } catch (e) {
      setChangePasswordError(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteAccountError("Enter your password to confirm.");
      return;
    }
    setDeleteAccountLoading(true);
    setDeleteAccountError(null);
    try {
      await deleteAccount(deletePassword);
      clearToken();
      setUser(null);
      navigate("/login");
    } catch (e) {
      setDeleteAccountError(e instanceof Error ? e.message : "Failed to delete account.");
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 sm:mb-10">
          Settings
        </h1>

        {/* Profile Settings */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">
            Profile Settings
          </h2>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm resize-none transition-colors"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">
            Notifications
          </h2>

          <div className="space-y-4 sm:space-y-5 pb-5 sm:pb-6 border-b border-white/3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Email Notifications
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Updates via email
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Push Notifications
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Browser notifications
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Activity Notifications
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  When friends race
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={activityNotifications}
                  onChange={(e) => setActivityNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Leaderboard Notifications
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Rank changes
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={leaderboardNotifications}
                  onChange={(e) =>
                    setLeaderboardNotifications(e.target.checked)
                  }
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">
            Privacy
          </h2>

          <div className="space-y-4 sm:space-y-5 pb-5 sm:pb-6 border-b border-white/3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Private Profile
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Friends only
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={privateProfile}
                  onChange={(e) => setPrivateProfile(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground text-xs sm:text-sm">
                  Show Race History
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Show your results
                </p>
              </div>
              <label className="flex items-center cursor-pointer flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={showRaceHistory}
                  onChange={(e) => setShowRaceHistory(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section>
          <h2 className="text-xs font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">
            Account
          </h2>

          {!user ? (
            <div className="bg-card/15 rounded-lg border border-white/4 p-4 sm:p-6">
              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-white/3 pb-3">
                <button
                  onClick={() => {
                    setAuthTab("login");
                    setAuthError(null);
                  }}
                  className={`text-xs sm:text-sm font-medium pb-1 border-b-2 transition-colors ${
                    authTab === "login"
                      ? "text-foreground border-[rgb(240,28,28)]"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthError(null);
                  }}
                  className={`text-xs sm:text-sm font-medium pb-1 border-b-2 transition-colors ${
                    authTab === "signup"
                      ? "text-foreground border-[rgb(240,28,28)]"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  Create account
                </button>
              </div>

              {authError && (
                <p className="text-xs text-[rgb(240,28,28)] mb-4">{authError}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={authSubmitting}
                    className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={authTab === "signup" ? "Min 8 characters" : "••••••••"}
                    disabled={authSubmitting}
                    className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-colors disabled:opacity-50"
                  />
                </div>

                {authTab === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Display Name{" "}
                      <span className="text-muted-foreground/60">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      placeholder="Your name"
                      disabled={authSubmitting}
                      className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-colors disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  onClick={handleAuthSubmit}
                  disabled={authSubmitting}
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm disabled:opacity-50"
                  style={{ backgroundColor: "rgb(240, 28, 28)" }}
                >
                  {authSubmitting
                    ? authTab === "signup"
                      ? "Creating…"
                      : "Signing in…"
                    : authTab === "signup"
                      ? "Create account"
                      : "Log in"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="#account-display-name"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  Edit display name
                </a>
                <a
                  href="#change-password"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Change password
                </a>
                <a
                  href="#delete-account"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete account
                </a>
              </div>
              <div id="account-display-name" className="bg-card/15 rounded-lg border border-white/4 p-4 sm:p-6 scroll-mt-4">
                <p className="text-xs text-muted-foreground/60 mb-3">Signed in as</p>
                <p className="text-xs text-muted-foreground mb-1">{user.email}</p>

                <div className="mt-4 pt-4 border-t border-white/3">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Display Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => {
                        setEditDisplayName(e.target.value);
                        setProfileError(null);
                        setProfileSaved(false);
                      }}
                      disabled={savingProfile}
                      className="flex-1 px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={isProfileSaveDisabled}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm disabled:opacity-50"
                      style={{ backgroundColor: "rgb(240, 28, 28)" }}
                    >
                      {savingProfile ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {profileError && (
                    <p className="text-xs text-[rgb(240,28,28)] mt-2">{profileError}</p>
                  )}
                  {profileSaved && (
                    <p className="text-xs text-green-400 mt-2">Saved</p>
                  )}
                </div>
              </div>

              <div id="change-password" className="scroll-mt-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Change password</p>
                <form onSubmit={handleChangePassword} className="space-y-2 max-w-xs">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setChangePasswordError(null); }}
                    placeholder="Current password"
                    disabled={changePasswordLoading}
                    className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setChangePasswordError(null); }}
                    placeholder="New password (min 8 characters)"
                    disabled={changePasswordLoading}
                    className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm"
                  />
                  {changePasswordError && <p className="text-xs text-[rgb(240,28,28)]">{changePasswordError}</p>}
                  {changePasswordSuccess && <p className="text-xs text-green-400">Password updated.</p>}
                  <button
                    type="submit"
                    disabled={changePasswordLoading || !currentPassword.trim() || !newPassword.trim()}
                    className="px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "rgb(240, 28, 28)" }}
                  >
                    {changePasswordLoading ? "Updating…" : "Update password"}
                  </button>
                </form>
              </div>
              <div id="delete-account" className="scroll-mt-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Delete account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and data. This cannot be undone.</p>
                <form onSubmit={handleDeleteAccount} className="space-y-2 max-w-xs">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteAccountError(null); }}
                    placeholder="Enter your password to confirm"
                    disabled={deleteAccountLoading}
                    className="w-full px-3 py-1.5 sm:py-2 bg-card/15 rounded-lg border border-white/4 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 text-xs sm:text-sm"
                  />
                  {deleteAccountError && <p className="text-xs text-[rgb(240,28,28)]">{deleteAccountError}</p>}
                  <button
                    type="submit"
                    disabled={deleteAccountLoading || !deletePassword.trim()}
                    className="px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 border border-[rgba(240,28,28,0.5)]"
                    style={{ backgroundColor: "rgba(240, 28, 28, 0.2)" }}
                  >
                    {deleteAccountLoading ? "Deleting…" : "Delete my account"}
                  </button>
                </form>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2.5 bg-[rgba(240,28,28,0.15)] hover:bg-[rgba(240,28,28,0.25)] rounded-lg font-medium text-[rgb(240,28,28)] transition-colors text-xs sm:text-sm text-left border border-[rgba(240,28,28,0.3)] disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          )}
        </section>

        {/* System Status */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">
            System Status
          </h2>
          {systemStatusLoading ? (
            <div className="bg-card/15 rounded-lg border border-white/4 p-4 sm:p-6 space-y-3">
              <SkeletonBlock height={16} width={120} className="rounded" />
              <SkeletonBlock height={14} width="80%" className="rounded" />
              <SkeletonBlock height={14} width="60%" className="rounded" />
              <SkeletonBlock height={14} width="70%" className="rounded" />
            </div>
          ) : systemStatusError ? (
            <div className="bg-card/15 rounded-lg border border-white/4 p-4 sm:p-6">
              <p className="text-sm text-white/70">{systemStatusError}</p>
              <button
                type="button"
                onClick={() => fetchSystemStatus()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          ) : (
            <div className="bg-card/15 rounded-lg border border-white/4 p-4 sm:p-6">
              <div className="grid gap-2 text-sm text-white/80">
                <p><span className="text-white/50">Environment:</span> {systemStatus?.environment ?? "—"}</p>
                <p><span className="text-white/50">Version:</span> {systemStatus?.version ?? APP_VERSION}</p>
                <p>
                  <span className="text-white/50">Uptime:</span>{" "}
                  {systemStatus?.uptime != null
                    ? typeof systemStatus.uptime === "number"
                      ? `${Math.floor(systemStatus.uptime / 60)}m`
                      : String(systemStatus.uptime)
                    : "—"}
                </p>
                <p>
                  <span className="text-white/50">DB:</span>{" "}
                  {systemStatus?.db?.status ?? "—"}
                  {systemStatus?.db?.latencyMs != null && (
                    <span className="text-white/50"> ({systemStatus.db.latencyMs}ms)</span>
                  )}
                </p>
                {Array.isArray(systemStatus?.featureFlags) && systemStatus.featureFlags.length > 0 && (
                  <p>
                    <span className="text-white/50">Feature flags:</span>{" "}
                    {systemStatus.featureFlags.join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchSystemStatus()}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="mt-12 sm:mt-16 flex gap-2 sm:gap-3 pt-8 sm:pt-10 border-t border-white/3">
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-card/20 border border-white/4 text-foreground rounded-lg font-medium hover:bg-card/30 transition-colors text-xs sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
