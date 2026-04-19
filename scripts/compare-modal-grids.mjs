import { chromium } from "playwright";

function near(a, b, t = 2) {
  return Math.abs(a - b) <= t;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

async function measure(title) {
  await page.locator("#projects-list").scrollIntoViewIfNeeded();
  await page.locator("li", { hasText: title }).first().click();
  await page.locator("button[aria-label='Close']").waitFor({ state: "visible" });
  await page.waitForTimeout(300);

  const frames = await page.evaluate((t) => {
    const h2 = Array.from(document.querySelectorAll("h2")).find((el) => el.textContent?.trim() === t);
    const content = h2?.closest("div[style*='padding: 4rem 3rem 5rem']") || h2?.parentElement;
    const grid = content ? Array.from(content.querySelectorAll("div")).find((d) => (d).style.display === "grid" && (d).style.gridTemplateColumns.includes("repeat(4")) : null;
    if (!grid) return [];

    return Array.from(grid.children).slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { x: r.x, y: r.y, w: r.width, h: r.height, radius: cs.borderRadius };
    });
  }, title);

  await page.locator("button[aria-label='Close']").click();
  await page.waitForTimeout(200);
  return frames;
}

const corona = await measure("Corona");
const inside = await measure("Inside Outside");

const result = {
  coronaCount: corona.length,
  insideCount: inside.length,
  coronaTopEqual: corona.length >= 2 ? near(corona[0].w, corona[1].w) && near(corona[0].h, corona[1].h) : false,
  coronaBottomEqual: corona.length >= 6
    ? near(corona[2].w, corona[3].w) && near(corona[3].w, corona[4].w) && near(corona[4].w, corona[5].w)
      && near(corona[2].h, corona[3].h) && near(corona[3].h, corona[4].h) && near(corona[4].h, corona[5].h)
    : false,
  radiusMatchInside: corona.length > 0 && inside.length > 0 ? corona[0].radius === inside[0].radius : false,
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
