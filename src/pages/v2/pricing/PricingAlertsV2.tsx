type PricingAlertsV2Props = {
  message: string | null;
  warning: string | null;
  error: string | null;
};

export function PricingAlertsV2({
  message,
  warning,
  error,
}: PricingAlertsV2Props) {
  if (!message && !warning && !error) return null;

  return (
    <div className="space-y-3">
      {message && (
        <p className="rounded-v2-sm border border-v2-success/25 bg-v2-success/10 px-3 py-2 font-v2-body text-sm text-v2-success">
          {message}
        </p>
      )}
      {warning && (
        <p className="rounded-v2-sm border border-amber-500/25 bg-amber-500/10 px-3 py-2 font-v2-body text-sm text-amber-200">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-v2-sm border border-v2-error/25 bg-v2-error/10 px-3 py-2 font-v2-body text-sm text-v2-error">
          {error}
        </p>
      )}
    </div>
  );
}
