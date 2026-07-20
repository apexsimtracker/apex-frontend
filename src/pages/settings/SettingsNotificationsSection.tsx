import { Button } from "@/components/ui/button";
import { SettingsRow } from "@/components/app-ui/SettingsRow";
import { AppSwitch } from "@/components/app-ui/AppSwitch";
import type { InAppNotificationPrefs } from "@/lib/api";
import type { ApexSettings } from "@/lib/settingsStorage";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import { appOutlineButtonClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

type SettingsNotificationsSectionProps = {
  settings: ApexSettings;
  notificationSaving: boolean;
  applyNotificationToggle: (
    key: "emailNotifications" | "showNotificationBadge",
    value: boolean,
  ) => void | Promise<void>;
  applyInAppCategoryToggle: (
    key: keyof InAppNotificationPrefs,
    value: boolean,
  ) => void | Promise<void>;
  onResetDefaults: () => void | Promise<void>;
};

export default function SettingsNotificationsSection({
  settings,
  notificationSaving,
  applyNotificationToggle,
  applyInAppCategoryToggle,
  onResetDefaults,
}: SettingsNotificationsSectionProps) {
  return (
    <SettingsSectionChrome title="Notifications">
      <p className="mb-4 text-xs text-apex-on-surface-variant">
        Preferences are saved to your account. Security emails (verification,
        password reset) always send. Admin announcements are always delivered
        in-app.
      </p>
      <div className="-mx-1">
        <SettingsRow
          label="Email notifications"
          description="Optional updates and announcements by email. Does not affect verification, password reset, or Pro welcome emails."
        >
          <AppSwitch
            checked={settings.emailNotifications}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyNotificationToggle("emailNotifications", v)
            }
            aria-label="Email notifications"
          />
        </SettingsRow>
        <SettingsRow
          label="In-app notification alerts"
          description="Unread count on the bell in the navigation bar. You can still open notifications and follow requests when this is off."
        >
          <AppSwitch
            checked={settings.showNotificationBadge}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyNotificationToggle("showNotificationBadge", v)
            }
            aria-label="In-app notification alerts"
          />
        </SettingsRow>
      </div>

      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wide text-apex-on-surface-variant">
        In-app categories
      </p>
      <div className="-mx-1">
        <SettingsRow
          label="Social notifications"
          description="Follows, follow requests, and community replies."
        >
          <AppSwitch
            checked={settings.inAppNotificationPrefs.social}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("social", v)
            }
            aria-label="Social notifications"
          />
        </SettingsRow>
        <SettingsRow
          label="Challenge notifications"
          description="Challenge start, end, results, and admin actions on your entries."
        >
          <AppSwitch
            checked={settings.inAppNotificationPrefs.challenges}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("challenges", v)
            }
            aria-label="Challenge notifications"
          />
        </SettingsRow>
        <SettingsRow
          label="Session activity"
          description="Likes and comments on your sessions."
        >
          <AppSwitch
            checked={settings.inAppNotificationPrefs.activity}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("activity", v)
            }
            aria-label="Session activity notifications"
          />
        </SettingsRow>
        <SettingsRow
          label="Account and billing"
          description="Subscription changes and account status updates."
        >
          <AppSwitch
            checked={settings.inAppNotificationPrefs.account}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("account", v)
            }
            aria-label="Account and billing notifications"
          />
        </SettingsRow>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("mt-4", appOutlineButtonClassName)}
        disabled={notificationSaving}
        onClick={() => void onResetDefaults()}
      >
        Reset to defaults
      </Button>
    </SettingsSectionChrome>
  );
}
