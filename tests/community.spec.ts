import { expect, test, type Page } from "@playwright/test";
import { clearGuestSession, gotoAuthenticated } from "./helpers/auth";
import {
  createDiscussionViaApi,
  deleteDiscussionViaApi,
} from "./helpers/community";
import { loginPersona } from "./helpers/personas";

const E2E_BODY =
  "E2E community discussion body with enough characters for validation.";

function uniqueRunId(): string {
  return `e2e-${Date.now()}`;
}

async function selectCommunityCategory(
  page: Page,
  label: RegExp,
): Promise<void> {
  await page.getByRole("button", { name: label }).click();
}

test.describe("@community", () => {
  test.describe.configure({ mode: "serial" });

  test("F1 — list, filter, and search discussions", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    const setupTitle = `E2E Setup ${runId}`;
    const guidesTitle = `E2E Guides ${runId}`;
    const generalTitle = `E2E General ${runId}`;
    const createdIds: string[] = [];

    try {
      const [setup, guides, general] = await Promise.all([
        createDiscussionViaApi(request, auth, {
          category: "setup",
          title: setupTitle,
          description: E2E_BODY,
        }),
        createDiscussionViaApi(request, auth, {
          category: "guides",
          title: guidesTitle,
          description: E2E_BODY,
        }),
        createDiscussionViaApi(request, auth, {
          category: "general",
          title: generalTitle,
          description: E2E_BODY,
        }),
      ]);
      createdIds.push(setup.id, guides.id, general.id);

      await page.goto("/community");
      await expect(
        page.getByRole("heading", { name: "Sim Racing Community" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: setupTitle })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole("link", { name: guidesTitle })).toBeVisible();
      await expect(
        page.getByRole("link", { name: generalTitle }),
      ).toBeVisible();

      await selectCommunityCategory(page, /^General\b/);
      await expect(
        page.getByRole("link", { name: generalTitle }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: setupTitle })).toHaveCount(0);
      await expect(page.getByRole("link", { name: guidesTitle })).toHaveCount(
        0,
      );

      await selectCommunityCategory(page, /^Setups\b/);
      await expect(page.getByRole("link", { name: setupTitle })).toBeVisible();
      await expect(page.getByRole("link", { name: generalTitle })).toHaveCount(
        0,
      );

      await selectCommunityCategory(page, /^Guides\b/);
      await expect(page.getByRole("link", { name: guidesTitle })).toBeVisible();
      await expect(page.getByRole("link", { name: setupTitle })).toHaveCount(0);

      await selectCommunityCategory(page, /^All\b/);
      await page.getByPlaceholder("Search...").fill(runId);
      await expect(page.getByRole("link", { name: setupTitle })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole("link", { name: guidesTitle })).toBeVisible();
      await expect(
        page.getByRole("link", { name: generalTitle }),
      ).toBeVisible();
    } finally {
      for (const id of createdIds) {
        await deleteDiscussionViaApi(request, auth, id).catch(() => undefined);
      }
    }
  });

  test("F2 — create discussion in General and delete", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const title = `E2E UI Create ${uniqueRunId()}`;
    let discussionId: string | null = null;

    try {
      await gotoAuthenticated(page, auth, "/community");
      await page.getByRole("button", { name: "New Discussion" }).click();
      await expect(
        page.getByRole("heading", { name: "Create New Discussion" }),
      ).toBeVisible();

      const createDialog = page.getByRole("dialog");
      await createDialog
        .getByRole("button", { name: "General", exact: true })
        .click();
      await createDialog.getByLabel("Discussion Title").fill(title);
      await createDialog.getByLabel("Description").fill(E2E_BODY);

      const createPost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/community/discussions") &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await createDialog.getByRole("button", { name: "Create" }).click();
      const createRes = await createPost;
      const created = (await createRes.json()) as { id?: string };
      discussionId = created.id?.trim() ?? null;
      expect(discussionId).toBeTruthy();

      await expect(createDialog).toBeHidden({ timeout: 30_000 });
      await expect(page.getByRole("link", { name: title })).toBeVisible({
        timeout: 30_000,
      });

      await page.getByRole("link", { name: title }).click();
      await expect(page).toHaveURL(new RegExp(`/discussion/${discussionId}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      await expect(page.getByText(E2E_BODY)).toBeVisible();

      await page.getByRole("button", { name: "Post options" }).click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await expect(
        page.getByRole("heading", { name: "Delete this discussion?" }),
      ).toBeVisible();
      const deletePost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/community/discussions/${discussionId}`) &&
          res.request().method() === "DELETE",
      );
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await deletePost;
      await expect(page).toHaveURL(/\/community$/);
      discussionId = null;
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("F3 — like, comment, and edit own discussion", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const title = `E2E Detail CRUD ${uniqueRunId()}`;
    const editedTitle = `${title} (edited)`;
    const commentText = "E2E reply from Playwright community suite.";
    let discussionId: string | null = null;

    try {
      const created = await createDiscussionViaApi(request, auth, {
        category: "general",
        title,
        description: E2E_BODY,
      });
      discussionId = created.id;

      await gotoAuthenticated(page, auth, `/discussion/${discussionId}`);
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();

      const likePost = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/api/community/discussions/${discussionId}/like`) &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await page.getByRole("button", { name: "Like post" }).click();
      await likePost;
      await expect(
        page.getByRole("button", { name: "Unlike post" }),
      ).toBeVisible();

      const commentPost = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/api/community/discussions/${discussionId}/comments`) &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await page.getByPlaceholder("Write a reply…").fill(commentText);
      await page.getByRole("button", { name: "Post reply" }).click();
      await commentPost;
      await expect(page.getByText(commentText)).toBeVisible({
        timeout: 30_000,
      });

      await page.getByRole("button", { name: "Reply" }).first().click();
      const nestedText = "E2E nested reply stays at depth 1.";
      const nestedPost = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/api/community/discussions/${discussionId}/comments`) &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await page.getByPlaceholder("Write a reply…").last().fill(nestedText);
      await page.getByRole("button", { name: "Post" }).last().click();
      await nestedPost;
      await expect(page.getByText(nestedText)).toBeVisible({ timeout: 30_000 });

      await page.getByRole("button", { name: "Edit" }).first().click();
      await page.getByPlaceholder("Edit comment…").fill(`${commentText} edited`);
      const editComment = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/api/community/discussions/${discussionId}/comments/`) &&
          res.request().method() === "PATCH" &&
          res.ok(),
      );
      await page.getByRole("button", { name: "Save" }).click();
      await editComment;
      await expect(page.getByText(`${commentText} edited`)).toBeVisible();

      await page.getByRole("button", { name: "Post options" }).click();
      await page.getByRole("menuitem", { name: "Edit post" }).click();
      await expect(
        page.getByRole("heading", { name: "Edit discussion" }),
      ).toBeVisible();

      const editDialog = page.getByRole("dialog");
      await editDialog.locator("input").fill(editedTitle);
      await editDialog
        .locator("textarea")
        .fill(`${E2E_BODY} Updated once for edit test.`);

      const patchPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/community/discussions/${discussionId}`) &&
          res.request().method() === "PATCH" &&
          res.ok(),
      );
      await editDialog.getByRole("button", { name: "Save" }).click();
      await patchPost;

      await expect(editDialog).toBeHidden({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", { level: 1, name: editedTitle }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Edited" })).toBeVisible();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("F4 — guest can read; write actions prompt login", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const title = `E2E Guest Read ${uniqueRunId()}`;
    let discussionId: string | null = null;

    try {
      const created = await createDiscussionViaApi(request, auth, {
        category: "general",
        title,
        description: E2E_BODY,
      });
      discussionId = created.id;

      await clearGuestSession(page);
      await page.goto("/community");
      await expect(
        page.getByRole("heading", { name: "Sim Racing Community" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: title })).toBeVisible();

      await page.getByRole("button", { name: "New Discussion" }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(
        page.getByText("Sign in to start a discussion."),
      ).toBeVisible();

      await page.goto(`/discussion/${discussionId}`);
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      await expect(page.getByText(E2E_BODY)).toBeVisible();

      await page.getByRole("button", { name: "Like post" }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByText("Sign in to like posts.")).toBeVisible();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });
});
