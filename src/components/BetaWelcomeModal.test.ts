import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/lib/api/authAndContact";
import { betaAccessNoticeCopy } from "./BetaWelcomeModal";

const sixtyDayUser: AuthUser = {
  id: "user-1",
  email: "hello@example.com",
  isBetaUser: true,
  hasPro: true,
  betaTrialStartedAt: "2026-08-30T00:00:00.000Z",
  betaTrialExpiresAt: "2026-10-29T00:00:00.000Z",
  betaAccessPreviousExpiresAt: "2026-09-29T00:00:00.000Z",
  hasSeenBetaWelcomeModal: false,
};

describe("beta access notice copy", () => {
  it("shows the actual duration and extension context", () => {
    const copy = betaAccessNoticeCopy({
      ...sixtyDayUser,
      betaAccessNoticeType: "EXTENDED",
    });

    expect(copy.title).toBe("Your Pro access was extended");
    expect(copy.description).toContain("60 days");
    expect(copy.description).toContain("extended from");
    expect(copy.description).not.toContain("30 days");
  });

  it("distinguishes restored access from a new-user welcome", () => {
    const restored = betaAccessNoticeCopy({
      ...sixtyDayUser,
      betaAccessNoticeType: "RESTORED",
    });
    const welcome = betaAccessNoticeCopy({
      ...sixtyDayUser,
      betaAccessNoticeType: "WELCOME",
    });

    expect(restored.title).toBe("Your Pro access was restored");
    expect(welcome.title).toBe("Welcome to Apex Pro");
  });
});
