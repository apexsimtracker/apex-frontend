import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
import type { Discussion } from "@/lib/api";

type DiscussionOriginalPostModalV2Props = {
  open: boolean;
  discussion: Discussion;
  onClose: () => void;
};

export default function DiscussionOriginalPostModalV2({
  open,
  discussion,
  onClose,
}: DiscussionOriginalPostModalV2Props) {
  if (!open) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title="Original post"
      size="md"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
      bodyClassName="min-h-0 space-y-3 text-sm"
    >
      <p className="font-semibold text-foreground">
        {discussion.originalTitle ?? discussion.title}
      </p>
      <p className="whitespace-pre-wrap text-muted-foreground">
        {discussion.originalBody ??
          discussion.content ??
          discussion.description ??
          ""}
      </p>
    </BaseModal>
  );
}
