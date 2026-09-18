type SessionModerationTargetInput = {
  sessionId: string;
  challengeId?: string | null;
  authorRole?: "USER" | "ADMIN";
};

export function sessionModerationTargets({
  sessionId,
}: SessionModerationTargetInput) {
  return {
    hide: {
      contentType: "SESSION" as const,
      targetContentId: sessionId,
    },
  };
}
