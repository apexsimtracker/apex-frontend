export function PricingHero() {
  return (
    <div className="relative text-center">
      <div
        className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-32 max-w-lg rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(240, 28, 28, 0.35) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <h1 className="relative text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Choose your plan
      </h1>
      <p className="relative mt-3 text-pretty text-muted-foreground">
        Start free. Upgrade to Pro for unlimited history, analytics, and more.
      </p>
    </div>
  );
}
