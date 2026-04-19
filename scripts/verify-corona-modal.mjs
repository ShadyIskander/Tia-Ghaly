import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.locator("#projects-list").scrollIntoViewIfNeeded();
await page.locator("li", { hasText: "Corona" }).first().click();
await page.locator("button[aria-label='Close']").waitFor({ state: "visible" });
await page.waitForTimeout(400);

const result = await page.evaluate(() => {
  const title = Array.from(document.querySelectorAll("h2")).find((h) => h.textContent?.trim() === "Corona");
  const content = title?.closest("div[style*='padding: 4rem 3rem 5rem']") || null;
  const imgs = content ? Array.from(content.querySelectorAll("img")) : [];
  const fits = imgs.map((i) => getComputedStyle(i).objectFit);
  const texts = content ? Array.from(content.querySelectorAll("p")).map((p) => p.textContent?.trim() || "") : [];

  return {
    imageCount: imgs.length,
    objectFits: [...new Set(fits)],
    firstText: texts[0],
    lastText: texts[texts.length - 1],
  };
});

console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: "docs/screenshots/corona-modal-balanced.png", fullPage: false });

await browser.close();
