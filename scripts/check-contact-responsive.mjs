import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);

fs.mkdirSync("test-results/contact-check", { recursive: true });
await page.screenshot({ path: "test-results/contact-check/contact-1440.png" });

const desktop = await page.locator("#contact div").first().evaluate((el) => {
  const s = getComputedStyle(el);
  return { fontSize: s.fontSize, lineHeight: s.lineHeight };
});

await page.setViewportSize({ width: 430, height: 1400 });
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await page.screenshot({ path: "test-results/contact-check/contact-430.png" });

const mobile = await page.locator("#contact div").first().evaluate((el) => {
  const s = getComputedStyle(el);
  return { fontSize: s.fontSize, lineHeight: s.lineHeight };
});

console.log("CONTACT responsive check:", { desktop, mobile });

await browser.close();
