import { useState } from "react";
import { Search } from "lucide-react";
import { UserSearchModalV2 } from "./UserSearchModalV2";

export function UserSearchTriggerV2() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center text-v2-on-surface-variant transition-colors hover:text-v2-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70"
        aria-label="Search users"
        title="Find people"
      >
        <Search className="size-6" aria-hidden />
      </button>
      <UserSearchModalV2 open={open} onOpenChange={setOpen} />
    </>
  );
}
