import { useState } from "react";
import { Search } from "lucide-react";
import { UserSearchModal } from "@/components/UserSearchModal";

export function UserSearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        aria-label="Search users"
        title="Find people"
      >
        <Search className="size-5 text-foreground/70 transition-colors hover:text-foreground" />
      </button>
      <UserSearchModal open={open} onOpenChange={setOpen} />
    </>
  );
}
