import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/features/settings/components/SettingsRow";
import type { ApexSettings } from "@/lib/settingsStorage";
import type { SessionVisibility } from "@/lib/api";
import { SettingsSectionChromeV2 } from "./SettingsSectionChromeV2";

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
        <div className="-mx-1 divide-y divide-v2-outline-variant/10">
          <SettingsRow
            label="Private profile"
            description="Only approved followers can view your stats, sessions, and race history."
          >
            <Switch
              checked={settings.privateProfile}
              disabled={privacySaving}
              onCheckedChange={(v) =>
                void applyPrivacyToggle("privateProfile", v)
              }
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
              onCheckedChange={(v) =>
                void applyPrivacyToggle("manualFollowApproval", v)
              }
            />
          </SettingsRow>
        </div>

        <div className="space-y-4 border-t border-v2-outline-variant/10 pt-6">
          <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
            Session Visibility
          </label>
          <fieldset disabled={privacySaving} className="space-y-3">
            {sessionVisibilityOptions.map((opt) => (
              <div key={opt.value} className="flex gap-3">
                <input
                  type="radio"
                  id={`v2-session-vis-${opt.value}`}
                  name="sessionVisibility"
                  className="mt-1 size-4 shrink-0 accent-v2-primary"
                  checked={settings.sessionVisibility === opt.value}
                  onChange={() => void applySessionVisibility(opt.value)}
                />
                <div className="min-w-0">
                  <Label
                    htmlFor={`v2-session-vis-${opt.value}`}
                    className="cursor-pointer font-v2-headline text-sm font-bold text-v2-on-surface"
                  >
                    {opt.title}
                  </Label>
                  <p className="mt-0.5 font-v2-body text-xs text-v2-on-surface-variant">
                    {opt.description}
                  </p>
                </div>
              </div>
            ))}
          </fieldset>
        </div>

        <Button
          type="button"
          variant="outline"
          className="hover:bg-v2-surface-variant w-full border-v2-outline-variant/20 bg-v2-surface-container-highest font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-on-surface"
          onClick={onManageFollowRequests}
        >
          Manage follow requests
        </Button>
      </div>
    </SettingsSectionChromeV2>
  );
}
