import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAdminSessionComment } from "./adminSessions";

const mocks = vi.hoisted(() => ({
  fetchApi: vi.fn(),
}));

vi.mock("./fetchClient", () => ({
  fetchApi: mocks.fetchApi,
}));

describe("admin session comment moderation API", () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset();
    mocks.fetchApi.mockResolvedValue(undefined);
  });

  it("uses the ADMIN-only comment endpoint", async () => {
    await deleteAdminSessionComment("session/1", "reply/2");

    expect(mocks.fetchApi).toHaveBeenCalledWith(
      "DELETE",
      "/api/admin/sessions/session%2F1/comments/reply%2F2",
      undefined,
      false,
    );
  });
});
