import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PAGES = [
  { name: "home", path: "/" },
  { name: "profile", path: "/profile" },
  { name: "community", path: "/community" },
  { name: "leaderboards", path: "/leaderboards" },
  { name: "settings", path: "/settings" },
];

const IPHONE_12_PRO = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const screenshotsDir = path.join(__dirname, "../screenshots");

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    for (const page of PAGES) {
      const context = await browser.newContext({
        viewport: { width: IPHONE_12_PRO.width, height: IPHONE_12_PRO.height },
        deviceScaleFactor: IPHONE_12_PRO.deviceScaleFactor,
        isMobile: IPHONE_12_PRO.isMobile,
        hasTouch: IPHONE_12_PRO.hasTouch,
        userAgent: IPHONE_12_PRO.userAgent,
      });

      const browser_page = await context.newPage();

      const url = `http://localhost:8080${page.path}`;

      try {
        await browser_page.goto(url, { waitUntil: "networkidle" });

        // Wait a bit for animations to settle
        await new Promise((r) => setTimeout(r, 1000));

        const screenshotPath = path.join(
          screenshotsDir,
          `${page.name}-iphone.png`,
        );
        await browser_page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

      } catch (pageError) {
        console.error(`❌ Error capturing ${page.name}:`, pageError.message);
      } finally {
        await context.close();
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
