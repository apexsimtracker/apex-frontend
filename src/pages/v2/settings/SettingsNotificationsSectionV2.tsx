import { Button } from "@/components/ui/button";
import { SettingsRowV2 } from "@/components/v2/ui/SettingsRowV2";
import { V2Switch } from "@/components/v2/ui/V2Switch";
import type { InAppNotificationPrefs } from "@/lib/api";
import type { ApexSettings } from "@/lib/settingsStorage";
import { SettingsSectionChromeV2 } from "./SettingsSectionChromeV2";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

type SettingsNotificationsSectionV2Props = {
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

export default function SettingsNotificationsSectionV2({
  settings,
  notificationSaving,
  applyNotificationToggle,
  applyInAppCategoryToggle,
  onResetDefaults,
}: SettingsNotificationsSectionV2Props) {
  return (
    <SettingsSectionChromeV2 title="Notifications">
      <p className="mb-4 text-xs text-v2-on-surface-variant">
        Preferences are saved to your account. Security emails (verification,
        password reset) always send. Admin announcements are always delivered
        in-app.
      </p>
      <div className="-mx-1">
        <SettingsRowV2
          label="Email notifications"
          description="Optional updates and announcements by email. Does not affect verification, password reset, or Pro welcome emails."
        >
          <V2Switch
            checked={settings.emailNotifications}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyNotificationToggle("emailNotifications", v)
            }
            aria-label="Email notifications"
          />
        </SettingsRowV2>
        <SettingsRowV2
          label="In-app notification alerts"
          description="Unread count on the bell in the navigation bar. You can still open notifications and follow requests when this is off."
        >
          <V2Switch
            checked={settings.showNotificationBadge}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyNotificationToggle("showNotificationBadge", v)
            }
            aria-label="In-app notification alerts"
          />
        </SettingsRowV2>
      </div>

      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wide text-v2-on-surface-variant">
        In-app categories
      </p>
      <div className="-mx-1">
        <SettingsRowV2
          label="Social notifications"
          description="Follows, follow requests, and community replies."
        >
          <V2Switch
            checked={settings.inAppNotificationPrefs.social}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("social", v)
            }
            aria-label="Social notifications"
          />
        </SettingsRowV2>
        <SettingsRowV2
          label="Challenge notifications"
          description="Challenge start, end, results, and admin actions on your entries."
        >
          <V2Switch
            checked={settings.inAppNotificationPrefs.challenges}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("challenges", v)
            }
            aria-label="Challenge notifications"
          />
        </SettingsRowV2>
        <SettingsRowV2
          label="Session activity"
          description="Likes and comments on your sessions."
        >
          <V2Switch
            checked={settings.inAppNotificationPrefs.activity}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("activity", v)
            }
            aria-label="Session activity notifications"
          />
        </SettingsRowV2>
        <SettingsRowV2
          label="Account and billing"
          description="Subscription changes and account status updates."
        >
          <V2Switch
            checked={settings.inAppNotificationPrefs.account}
            disabled={notificationSaving}
            onCheckedChange={(v) =>
              void applyInAppCategoryToggle("account", v)
            }
            aria-label="Account and billing notifications"
          />
        </SettingsRowV2>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("mt-4", v2OutlineButtonClassName)}
        disabled={notificationSaving}
        onClick={() => void onResetDefaults()}
      >
        Reset to defaults
      </Button>
    </SettingsSectionChromeV2>
  );
}
