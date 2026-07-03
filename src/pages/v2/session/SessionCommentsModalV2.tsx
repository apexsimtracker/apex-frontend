import { useQueryClient } from "@tanstack/react-query";
import { SessionCommentsModal } from "@/components/SessionCommentsModal";

type SessionCommentsModalV2Props = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * V2 wrapper around the existing V1 SessionCommentsModal. The modal renders in a
 * portal outside the `.v2-theme` scope, so it keeps the shared (dark) semantic
 * tokens. On a new comment we refresh the session detail cache so any
 * comment-derived counts stay in sync.
 */
export default function SessionCommentsModalV2({
  sessionId,
  isOpen,
  onClose,
}: SessionCommentsModalV2Props) {
  const queryClient = useQueryClient();

  return (
    <SessionCommentsModal
      sessionId={sessionId}
      isOpen={isOpen}
      onClose={onClose}
      onCommentAdded={() => {
        void queryClient.invalidateQueries({
          queryKey: ["sessions", "detail", sessionId],
        });
      }}
    />
  );
}
