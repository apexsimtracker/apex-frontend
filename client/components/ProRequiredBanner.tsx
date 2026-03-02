import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { PRO_REQUIRED_EVENT } from "@/lib/api";

export default function ProRequiredBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProRequired = () => {
      setVisible(true);
    };

    window.addEventListener(PRO_REQUIRED_EVENT, handleProRequired);
    return () => {
      window.removeEventListener(PRO_REQUIRED_EVENT, handleProRequired);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-200">
              Apex Pro Required
            </p>
            <p className="text-sm text-amber-200/70">
              Automatic telemetry uploads require Apex Pro.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
            >
              Upgrade
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="p-1 text-amber-200/60 hover:text-amber-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
