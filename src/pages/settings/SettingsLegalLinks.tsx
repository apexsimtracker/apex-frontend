import { Link } from "react-router-dom";
import { getFooterLegalLinks } from "@/config/navigation";
import { usePlatform } from "@/hooks/usePlatform";
import { SettingsSectionChrome } from "./SettingsSectionChrome";

export default function SettingsLegalLinks() {
  const { isNative } = usePlatform();
  const links = getFooterLegalLinks(isNative);

  return (
    <SettingsSectionChrome title="Legal" bare>
      <div className="flex flex-wrap gap-x-1 gap-y-0.5">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-apex-sm p-2 font-apex-body text-xs text-apex-on-surface-variant/70 transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </SettingsSectionChrome>
  );
}
