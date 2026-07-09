import { Button } from "@/components/ui/button";
import { SettingsRowV2 } from "@/components/v2/ui/SettingsRowV2";
import { V2Switch } from "@/components/v2/ui/V2Switch";
import { V2RadioGroup, V2RadioItem } from "@/components/v2/ui/V2RadioGroup";
import type { ApexSettings } from "@/lib/settingsStorage";
import type { SessionVisibility } from "@/lib/api";
import { SettingsSectionChromeV2 } from "./SettingsSectionChromeV2";
import { v2SecondaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";

type SessionVisibilityOption = {
  value: SessionVisibility;
  title: string;
  description: string;
};

type SettingsPrivacySectionV2Props = {
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

export default function SettingsPrivacySectionV2({
  settings,
  privacySaving,
  applyPrivacyToggle,
  applySessionVisibility,
  sessionVisibilityOptions,
  onManageFollowRequests,
}: SettingsPrivacySectionV2Props) {
  return (
    <SettingsSectionChromeV2 title="Privacy">
      <div className="space-y-8">
        <div className="-mx-1">
          <SettingsRowV2
            label="Private profile"
            description="Only approved followers can view your stats, sessions, and race history."
          >
            <V2Switch
              checked={settings.privateProfile}
              disabled={privacySaving}
              onCheckedChange={(v) =>
                void applyPrivacyToggle("privateProfile", v)
              }
              aria-label="Private profile"
            />
          </SettingsRowV2>
          <SettingsRowV2
            label="Manual follow approval"
            description={
              settings.privateProfile
                ? "When on, people send a follow request you approve in notifications or below."
                : "Turn on Private profile to require follow requests."
            }
          >
            <V2Switch
              checked={settings.manualFollowApproval}
              disabled={!settings.privateProfile || privacySaving}
              onCheckedChange={(v) =>
                void applyPrivacyToggle("manualFollowApproval", v)
              }
              aria-label="Manual follow approval"
            />
          </SettingsRowV2>
        </div>

        <div className="space-y-4 border-t border-v2-outline-variant/10 pt-6">
          <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
            Session Visibility
          </label>
          <V2RadioGroup
            value={settings.sessionVisibility}
            onValueChange={(v) =>
              void applySessionVisibility(v as SessionVisibility)
            }
            disabled={privacySaving}
          >
            {sessionVisibilityOptions.map((opt) => (
              <V2RadioItem
                key={opt.value}
                id={`v2-session-vis-${opt.value}`}
                value={opt.value}
                checked={settings.sessionVisibility === opt.value}
                onSelect={(v) =>
                  void applySessionVisibility(v as SessionVisibility)
                }
                disabled={privacySaving}
              >
                <label
                  htmlFor={`v2-session-vis-${opt.value}`}
                  className="cursor-pointer font-v2-headline text-sm font-bold text-v2-on-surface"
                >
                  {opt.title}
                </label>
                <p className="mt-0.5 text-xs text-v2-on-surface-variant">
                  {opt.description}
                </p>
              </V2RadioItem>
            ))}
          </V2RadioGroup>
        </div>

        <Button
          type="button"
          variant="outline"
          className={`w-full py-3 ${v2SecondaryButtonClassName}`}
          onClick={onManageFollowRequests}
        >
          Manage follow requests
        </Button>
      </div>
    </SettingsSectionChromeV2>
  );
}
