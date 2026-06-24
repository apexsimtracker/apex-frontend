import { type BrowserContext, type FrameLocator, type Page } from "@playwright/test";

const STRIPE_TEST_CARD = "4242424242424242";
const STRIPE_TEST_EXP = "12 / 28";
const STRIPE_TEST_CVC = "123";

/**
 * Completes RevenueCat → Stripe checkout (embedded iframe, redirect, or popup).
 */
export async function completeStripeCheckout(
  page: Page,
  context: BrowserContext
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await completeStripeCheckoutOnce(page, context);
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function completeStripeCheckoutOnce(
  page: Page,
  context: BrowserContext
): Promise<void> {
  const checkoutRoot = await resolveCheckoutRoot(page, context);
  await fillStripeCheckout(checkoutRoot);
  await submitStripeCheckout(page, checkoutRoot);
  await waitForReturnToApp(page);
}

async function resolveCheckoutRoot(
  page: Page,
  context: BrowserContext
): Promise<Page | FrameLocator> {
  const popup = await context.waitForEvent("page", { timeout: 5_000 }).catch(() => null);
  if (popup) {
    await popup.waitForLoadState("domcontentloaded");
    if (/checkout\.stripe\.com/.test(popup.url())) {
      return popup;
    }
  }

  if (/checkout\.stripe\.com/.test(page.url())) {
    return page;
  }

  await page.locator("iframe").first().waitFor({ state: "attached", timeout: 45_000 });

  const iframeCount = await page.locator("iframe").count();
  for (let i = iframeCount - 1; i >= 0; i -= 1) {
    const frame = page.frameLocator("iframe").nth(i);
    const hasCheckout = await frame
      .getByRole("heading", { name: /Subscribe to Apex Pro/i })
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (hasCheckout) {
      return frame;
    }
  }

  const lastFrame = page.frameLocator("iframe").last();
  await lastFrame
    .getByRole("button", { name: /^Subscribe$/i })
    .waitFor({ state: "visible", timeout: 10_000 });
  return lastFrame;
}

async function fillStripeCheckout(checkoutRoot: Page | FrameLocator): Promise<void> {
  const gbpButton = checkoutRoot.getByRole("button", { name: /^GB\s*GBP$/i });
  if (await gbpButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    if (await gbpButton.isEnabled().catch(() => false)) {
      await gbpButton.click();
    }
  }

  const cardNumber = checkoutRoot.getByRole("textbox", { name: /card number/i });
  await cardNumber.waitFor({ state: "visible", timeout: 20_000 });
  await cardNumber.fill(STRIPE_TEST_CARD);

  const expiration = checkoutRoot.getByRole("textbox", { name: /expiration/i });
  if (await expiration.isVisible().catch(() => false)) {
    await expiration.fill(STRIPE_TEST_EXP);
  }

  const cvc = checkoutRoot.getByRole("textbox", { name: /^CVC$/i });
  if (await cvc.isVisible().catch(() => false)) {
    await cvc.fill(STRIPE_TEST_CVC);
  }

  const cardholder = checkoutRoot.getByRole("textbox", { name: /cardholder name/i });
  if (await cardholder.isVisible().catch(() => false)) {
    await cardholder.fill("E2E Test User");
  }
}

async function submitStripeCheckout(
  page: Page,
  checkoutRoot: Page | FrameLocator
): Promise<void> {
  const subscribe = checkoutRoot.getByRole("button", { name: /^Subscribe$/i });
  await subscribe.click({ timeout: 15_000 });

  await page.getByText("Payment complete").waitFor({ state: "visible", timeout: 90_000 });

  const continueButton = page.getByRole("button", { name: /^Continue$/i });
  await continueButton.click({ timeout: 15_000 });
}

async function waitForReturnToApp(page: Page): Promise<void> {
  await page
    .getByTestId("billing-pro-active")
    .or(page.getByText(/Welcome to Apex Pro|subscription is active|Purchase completed/i))
    .first()
    .waitFor({ state: "visible", timeout: 90_000 });
}
