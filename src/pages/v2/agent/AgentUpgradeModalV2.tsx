import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";
import { toV2Path } from "@/config/navigation";
import type { AgentOs } from "@/hooks/useDetectedAgentOs";

type AgentUpgradeModalV2Props = {
  open: boolean;
  onClose: () => void;
  selectedOs: AgentOs;
};

export default function AgentUpgradeModalV2({
  open,
  onClose,
  selectedOs,
}: AgentUpgradeModalV2Props) {
  const navigate = useNavigate();

  return (
    <V2BaseModal
      isOpen={open}
      onClose={onClose}
      title="Apex Pro Required"
      description="Automatic telemetry uploads and the Apex Agent installer are available with Apex Pro."
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={onClose}
          >
            Not now
          </button>
          <button
            type="button"
            className={cn(
              v2PrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={() => {
              onClose();
              navigate(toV2Path("/pricing"));
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      }
    >
      <ul className="space-y-2 font-v2-body text-sm text-v2-on-surface-variant">
        <li className="flex items-start gap-2">
          <CheckCircle
            className="mt-0.5 size-4 shrink-0 text-v2-success"
            aria-hidden
          />
          Background F1 25 UDP telemetry capture
        </li>
        {selectedOs === "windows" && (
          <li className="flex items-start gap-2">
            <CheckCircle
              className="mt-0.5 size-4 shrink-0 text-v2-success"
              aria-hidden
            />
            Automatic iRacing session log uploads
          </li>
        )}
        {selectedOs === "windows" && (
          <li className="flex items-start gap-2">
            <CheckCircle
              className="mt-0.5 size-4 shrink-0 text-v2-success"
              aria-hidden
            />
            Automatic Le Mans Ultimate telemetry uploads
          </li>
        )}
        <li className="flex items-start gap-2">
          <CheckCircle
            className="mt-0.5 size-4 shrink-0 text-v2-success"
            aria-hidden
          />
          Unlimited session history and full analytics
        </li>
      </ul>
    </V2BaseModal>
  );
}
