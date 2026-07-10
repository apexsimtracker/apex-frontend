import { Plus } from "lucide-react";

type DiscussionReplyFabV2Props = {
  onClick: () => void;
};

export default function DiscussionReplyFabV2({
  onClick,
}: DiscussionReplyFabV2Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+1rem)] right-6 z-40 flex size-14 items-center justify-center rounded-xl bg-v2-primary text-white shadow-2xl transition-colors hover:bg-v2-primary/90 lg:hidden"
      aria-label="Add a reply"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  );
}
