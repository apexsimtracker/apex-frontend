export default function V2IndexPlaceholder() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-v2 bg-v2-surface-container p-8 text-center">
        <p className="font-v2-headline text-sm uppercase tracking-[0.2em] text-v2-on-surface-variant">
          Phase 0 shell
        </p>
        <h1 className="mt-3 font-v2-headline text-3xl font-semibold text-v2-on-surface">
          Apex V2
        </h1>
        <p className="mt-4 font-v2-body text-sm text-v2-on-surface-variant">
          V2 styling layer is isolated under{" "}
          <code className="text-v2-primary-fixed">.v2-theme</code>. V1 routes
          are unchanged.
        </p>
      </div>
    </div>
  );
}
