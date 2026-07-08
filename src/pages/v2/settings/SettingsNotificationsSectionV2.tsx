import { Button } from "@/components/ui/button";
import { SettingsRowV2 } from "@/components/v2/ui/SettingsRowV2";
import { V2Switch } from "@/components/v2/ui/V2Switch";
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
  onResetDefaults: () => void | Promise<void>;
};

export default function SettingsNotificationsSectionV2({
  settings,
  notificationSaving,
  applyNotificationToggle,
  onResetDefaults,
}: SettingsNotificationsSectionV2Props) {
  return (
    <SettingsSectionChromeV2 title="Notifications">
      <p className="mb-4 text-xs text-v2-on-surface-variant">
        Preferences are saved to your account. Security emails (verification,
        password reset) always send.
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
