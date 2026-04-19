import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const outDir = path.resolve("docs/screenshots");

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // 1) Home / Hero Section
  await page.screenshot({ path: path.join(outDir, "screenshot-hero.png"), fullPage: true });

  // 2) Theme Toggle and Mode - Mint
  await page.locator("button[aria-label='Change background colour']").click();
  await page.locator("button[title='Mint']").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "screenshot-theme-mint.png"), fullPage: true });

  // 3) Project Modal
  await page.locator("#projects-list").scrollIntoViewIfNeeded();
  await page.locator("li", { hasText: "Corona" }).first().click();
  await page.locator("button[aria-label='Close']").waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "screenshot-project-modal.png"), fullPage: true });

  // 4) About Overlay
  await page.locator("button[aria-label='Close']").click();
  await page.waitForTimeout(250);
  await page.locator("button[aria-label='About Tia Ghaly']").click();
  await page.getByText("THINGS", { exact: false }).first().waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "screenshot-about-overlay.png"), fullPage: true });

  // 5) Contact / More Work
  await page.locator("button", { hasText: "Close" }).first().click();
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "screenshot-contact.png"), fullPage: true });

  await browser.close();
  console.log(`Saved screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
