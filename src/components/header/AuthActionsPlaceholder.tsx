/** Neutral spacer while auth resolves — avoids guest Sign in / Get started flash. */
export default function AuthActionsPlaceholder({
  className = "h-9 w-[11.5rem]",
}: {
  className?: string;
}) {
  return <div className={className} aria-hidden />;
}
