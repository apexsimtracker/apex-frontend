import { describe, expect, it } from "vitest";
import { sessionModerationTargets } from "./sessionModerationTargets";

describe("sessionModerationTargets", () => {
  it.each([
    { challengeId: null, authorRole: "USER" as const },
    { challengeId: null, authorRole: "ADMIN" as const },
    { challengeId: "challenge-1", authorRole: "USER" as const },
    { challengeId: "challenge-1", authorRole: "ADMIN" as const },
  ])(
    "keeps the session hideable for role $authorRole and challenge $challengeId",
    ({ challengeId, authorRole }) => {
      expect(
        sessionModerationTargets({
          sessionId: "session-1",
          challengeId,
          authorRole,
        }),
      ).toEqual({
        hide: {
          contentType: "SESSION",
          targetContentId: "session-1",
        },
      });
    },
  );
});
