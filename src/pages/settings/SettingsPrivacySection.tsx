import { Button } from "@/components/ui/button";
import { SettingsRow } from "@/components/app-ui/SettingsRow";
import { AppSwitch } from "@/components/app-ui/AppSwitch";
import { AppRadioGroup, AppRadioItem } from "@/components/app-ui/AppRadioGroup";
import type { ApexSettings } from "@/lib/settingsStorage";
import type { SessionVisibility } from "@/lib/api";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import { appSecondaryButtonClassName } from "@/components/app-ui/appButtonClasses";

type SessionVisibilityOption = {
  value: SessionVisibility;
  title: string;
  description: string;
};

type SettingsPrivacySectionProps = {
  settings: ApexSettings;
  privacySaving: boolean;
  applyPrivacyToggle: (
    key: "privateProfile" | "manualFollowApproval",
    value: boolean,
  ) => void | Promise<void>;
  applySessionVisibility: (value: SessionVisibility) => void | Promise<void>;
  sessionVisibilityOptions: SessionVisibilityOption[];
  onManageFollowRequests: () => void;
};

export default function SettingsPrivacySection({
  settings,
  privacySaving,
  applyPrivacyToggle,
  applySessionVisibility,
  sessionVisibilityOptions,
  onManageFollowRequests,
}: SettingsPrivacySectionProps) {
  return (
    <SettingsSectionChrome title="Privacy">
      <div className="space-y-8">
        <div className="-mx-1">
          <SettingsRow
            label="Private profile"
            description="Only approved followers can view your stats, sessions, and race history."
          >
            <AppSwitch
              checked={settings.privateProfile}
              disabled={privacySaving}
              onCheckedChange={(v) =>
                void applyPrivacyToggle("privateProfile", v)
              }
              aria-label="Private profile"
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
            <AppSwitch
              checked={settings.manualFollowApproval}
              disabled={!settings.privateProfile || privacySaving}
              onCheckedChange={(v) =>
                void applyPrivacyToggle("manualFollowApproval", v)
              }
              aria-label="Manual follow approval"
            />
          </SettingsRow>
        </div>

        <div className="space-y-4 border-t border-apex-outline-variant/10 pt-6">
          <label className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
            Session Visibility
          </label>
          <AppRadioGroup
            value={settings.sessionVisibility}
            onValueChange={(v) =>
              void applySessionVisibility(v as SessionVisibility)
            }
            disabled={privacySaving}
          >
            {sessionVisibilityOptions.map((opt) => (
              <AppRadioItem
                key={opt.value}
                id={`session-vis-${opt.value}`}
                value={opt.value}
                checked={settings.sessionVisibility === opt.value}
                onSelect={(v) =>
                  void applySessionVisibility(v as SessionVisibility)
                }
                disabled={privacySaving}
              >
                <label
                  htmlFor={`session-vis-${opt.value}`}
                  className="cursor-pointer font-apex-headline text-sm font-bold text-apex-on-surface"
                >
                  {opt.title}
                </label>
                <p className="mt-0.5 text-xs text-apex-on-surface-variant">
                  {opt.description}
                </p>
              </AppRadioItem>
            ))}
          </AppRadioGroup>
        </div>

        <Button
          type="button"
          variant="outline"
          className={`w-full py-3 ${appSecondaryButtonClassName}`}
          onClick={onManageFollowRequests}
        >
          Manage follow requests
        </Button>
      </div>
    </SettingsSectionChrome>
  );
}
