type PricingAlertsProps = {
  message: string | null;
  warning: string | null;
  error: string | null;
};

export function PricingAlerts({ message, warning, error }: PricingAlertsProps) {
  if (!message && !warning && !error) return null;

  return (
    <div className="space-y-3">
      {message && (
        <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {message}
        </p>
      )}
      {warning && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
