import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "..", "screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const IPHONE_VIEWPORT = {
  width: 390,
  height: 844,
};

const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 800,
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Desktop screenshots
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport(DESKTOP_VIEWPORT);

    const pages = [
      { name: "home-desktop", path: "http://localhost:5173/" },
      { name: "challenges-desktop", path: "http://localhost:5173/challenges" },
      { name: "community-desktop", path: "http://localhost:5173/community" },
      { name: "profile-desktop", path: "http://localhost:5173/profile" },
    ];

    for (const page of pages) {
      try {
        await desktopPage.goto(page.path, {
          waitUntil: "networkidle2",
          timeout: 10000,
        });
        await desktopPage.waitForTimeout(500);
        await desktopPage.screenshot({
          path: path.join(screenshotsDir, `${page.name}.png`),
        });
        console.log(`✓ Screenshot: ${page.name}.png`);
      } catch (error) {
        console.log(`✗ Failed to screenshot ${page.name}: ${error.message}`);
      }
    }

    // iPhone screenshots
    const iphonePage = await browser.newPage();
    await iphonePage.setViewport(IPHONE_VIEWPORT);
    await iphonePage.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    );

    const iphonePages = [
      { name: "challenges-iphone", path: "http://localhost:5173/challenges" },
      { name: "community-iphone", path: "http://localhost:5173/community" },
    ];

    for (const page of iphonePages) {
      try {
        await iphonePage.goto(page.path, {
          waitUntil: "networkidle2",
          timeout: 10000,
        });
        await iphonePage.waitForTimeout(500);
        await iphonePage.screenshot({
          path: path.join(screenshotsDir, `${page.name}.png`),
        });
        console.log(`✓ Screenshot: ${page.name}.png`);
      } catch (error) {
        console.log(`✗ Failed to screenshot ${page.name}: ${error.message}`);
      }
    }

    await browser.close();
    console.log("\n✨ Screenshots saved to ./screenshots/");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
