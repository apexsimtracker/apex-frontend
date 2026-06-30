import { expect, test, type Page } from "@playwright/test";

function isContactEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function ensureGuest(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("apex_token");
    localStorage.removeItem("apex_session_token");
  });
}

test.describe("@static", () => {
  test.beforeEach(async ({ page }) => {
    await ensureGuest(page);
  });

  test("K1 — public home CTAs link to signup and pricing", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /Your data\./i }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByText("Sim racing performance hub"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Create account" }).first().click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();

    await page.goto("/");
    await page.locator("header").getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(
      page.getByRole("heading", { name: "Choose your plan" }),
    ).toBeVisible();
  });

  test("K2 — contact form submit success", async ({ page }) => {
    test.skip(
      !isContactEmailConfigured(),
      "RESEND_API_KEY must be set on the backend for contact form delivery",
    );

    const uniqueEmail = `e2e-static-contact-${Date.now()}@example.com`;

    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: "Contact us" }),
    ).toBeVisible();

    await page.getByLabel("Name").fill("E2E Static Guest");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel(/^Subject/i).fill("E2E static suite");
    await page
      .getByLabel("Message")
      .fill(
        "Automated Playwright contact form submission for the static marketing suite.",
      );

    const contactPost = page.waitForResponse(
      (res) =>
        res.url().includes("/api/contact") && res.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Send message" }).click();

    const response = await contactPost;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText("Message sent")).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "We received your message",
    );
  });

  test("K3 — legal pages render", async ({ page }) => {
    await page.goto("/terms-and-conditions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Terms & Conditions" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1. Agreement" }),
    ).toBeVisible();

    await page.goto("/privacy-policy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1. Introduction" }),
    ).toBeVisible();

    await page.goto("/cookie-policy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Cookie & Storage Policy" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1. Introduction" }),
    ).toBeVisible();

    await page.goto("/eula");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "End User License Agreement (EULA)",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1. Agreement" }),
    ).toBeVisible();

    await page.goto("/faq");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Frequently Asked Questions",
      }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.locator("#faq-accordion")).toBeVisible();
  });
});
