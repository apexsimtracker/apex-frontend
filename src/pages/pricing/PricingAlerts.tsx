type PricingAlertsProps = {
  message: string | null;
  warning: string | null;
  error: string | null;
};

export function PricingAlerts({
  message,
  warning,
  error,
}: PricingAlertsProps) {
  if (!message && !warning && !error) return null;

  return (
    <div className="space-y-3">
      {message && (
        <p className="rounded-apex-sm border border-apex-success/25 bg-apex-success/10 px-3 py-2 font-apex-body text-sm text-apex-success">
          {message}
        </p>
      )}
      {warning && (
        <p className="rounded-apex-sm border border-amber-500/25 bg-amber-500/10 px-3 py-2 font-apex-body text-sm text-amber-200">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-apex-sm border border-apex-error/25 bg-apex-error/10 px-3 py-2 font-apex-body text-sm text-apex-error">
          {error}
        </p>
      )}
    </div>
  );
}
