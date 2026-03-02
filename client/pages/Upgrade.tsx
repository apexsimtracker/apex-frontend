import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Check, Loader2, Zap, BarChart3, Trophy, Upload } from "lucide-react";
import { getUpgradeInfo, ApiError, type UpgradeInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";

const PRO_FEATURES = [
  { icon: Upload, text: "Automatic telemetry uploads" },
  { icon: Zap, text: "Apex Agent access" },
  { icon: BarChart3, text: "Full analytics & comparisons" },
  { icon: Trophy, text: "Future Pro-only challenges" },
];

export default function Upgrade() {
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getUpgradeInfo()
      .then((data) => {
        setUpgradeInfo(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setUpgradeInfo({
            effectivePlan: "FREE",
            canUpgrade: true,
            message: "Sign in to upgrade to Apex Pro.",
          });
        } else {
          setError(err instanceof Error ? err.message : "Failed to load upgrade info");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Sparkles className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Apex Pro</h1>
            <p className="mt-2 text-white/60">
              Unlock the full power of Apex with Pro features.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <feature.icon className="h-4 w-4 text-amber-500" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-500/10 p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : upgradeInfo?.canUpgrade ? (
              <div className="space-y-3">
                <Button
                  disabled
                  className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upgrade (Coming Soon)
                </Button>
                <p className="text-center text-xs text-white/40">
                  Billing will be enabled soon.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                  <span className="text-sm font-medium text-green-400">
                    You're already on Apex Pro
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
