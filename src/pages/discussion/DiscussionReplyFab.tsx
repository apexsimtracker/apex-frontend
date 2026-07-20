import { Plus } from "lucide-react";

type DiscussionReplyFabProps = {
  onClick: () => void;
};

export default function DiscussionReplyFab({
  onClick,
}: DiscussionReplyFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+1rem)] right-6 z-40 flex size-14 items-center justify-center rounded-xl bg-apex-primary text-white shadow-2xl transition-colors hover:bg-apex-primary/90 lg:hidden"
      aria-label="Add a reply"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  );
}
