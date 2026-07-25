import { lazy, Suspense, useState } from "react";
import { Search } from "lucide-react";

const UserSearchModal = lazy(() =>
  import("./UserSearchModal").then((m) => ({ default: m.UserSearchModal })),
);

export function UserSearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center text-apex-on-surface-variant transition-colors hover:text-apex-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/70"
        aria-label="Search users"
        title="Find people"
      >
        <Search className="size-6" aria-hidden />
      </button>
      {open ? (
        <Suspense fallback={null}>
          <UserSearchModal open={open} onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
