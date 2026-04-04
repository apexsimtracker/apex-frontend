import puppeteer from "puppeteer";
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

const IPHONE_VIEWPORT = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const screenshotsDir = path.join(__dirname, "../screenshots");

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    for (const page of PAGES) {
      const browser_page = await browser.newPage();
      await browser_page.setViewport(IPHONE_VIEWPORT);

      const url = `http://localhost:8080${page.path}`;

      await browser_page.goto(url, { waitUntil: "networkidle2" });

      // Wait a bit for animations to settle
      await new Promise((r) => setTimeout(r, 500));

      const screenshotPath = path.join(
        screenshotsDir,
        `${page.name}-iphone.png`,
      );
      await browser_page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      await browser_page.close();
    }
  } catch (error) {
    console.error("Error taking screenshots:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
