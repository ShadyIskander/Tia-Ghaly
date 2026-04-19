import { chromium } from "playwright";

function nearlyEqual(a, b, tol = 1.5) {
  return Math.abs(a - b) <= tol;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

async function inspectProject(title) {
  await page.locator("#projects-list").scrollIntoViewIfNeeded();
  await page.locator("li", { hasText: title }).first().click();
  await page.locator("button[aria-label='Close']").waitFor({ state: "visible" });
  await page.waitForTimeout(300);

  const data = await page.evaluate((t) => {
    const h2 = Array.from(document.querySelectorAll("h2")).find((el) => el.textContent?.trim() === t);
    const content = h2?.closest("div[style*='padding: 4rem 3rem 5rem']") || h2?.parentElement;
    if (!content) return null;

    const allGrids = Array.from(content.querySelectorAll("div")).filter((d) => (d).style.display === "grid");

    if (t === "Corona") {
      const topGrid = allGrids.find((g) => (g).style.gridTemplateColumns.includes("3fr 1fr"));
      const bottomGrid = allGrids.find((g) => (g).style.gridTemplateColumns.includes("repeat(4"));
      if (!topGrid || !bottomGrid) return null;

      const top = Array.from(topGrid.children).slice(0, 2).map((el, idx) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const img = el.querySelector("img");
        const imgStyle = img ? getComputedStyle(img) : null;
        return {
          index: idx,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          radius: cs.borderRadius,
          imgFit: imgStyle?.objectFit,
        };
      });

      const bottom = Array.from(bottomGrid.children).slice(0, 4).map((el, idx) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const img = el.querySelector("img");
        const imgStyle = img ? getComputedStyle(img) : null;
        return {
          index: idx + 2,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          radius: cs.borderRadius,
          imgFit: imgStyle?.objectFit,
        };
      });

      return { frames: [...top, ...bottom] };
    }

    const grid = allGrids.find((g) => (g).style.gridTemplateColumns.includes("repeat(4"));
    if (!grid) return null;

    const frames = Array.from(grid.children).slice(0, 6).map((el, idx) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const img = el.querySelector("img");
      const imgStyle = img ? getComputedStyle(img) : null;
      return {
        index: idx,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        radius: cs.borderRadius,
        imgFit: imgStyle?.objectFit,
      };
    });

    return { frames };
  }, title);

  await page.locator("button[aria-label='Close']").click();
  await page.waitForTimeout(200);
  return data;
}

const corona = await inspectProject("Corona");
const inside = await inspectProject("Inside Outside");

const c = corona?.frames ?? [];
const i = inside?.frames ?? [];

const result = {
  corona,
  inside,
  checks: {
    coronaTopSameHeight: c.length >= 2 ? nearlyEqual(c[0].height, c[1].height, 2.5) : false,
    coronaBottomEqualSize: c.length >= 6
      ? nearlyEqual(c[2].width, c[3].width) && nearlyEqual(c[3].width, c[4].width) && nearlyEqual(c[4].width, c[5].width)
        && nearlyEqual(c[2].height, c[3].height) && nearlyEqual(c[3].height, c[4].height) && nearlyEqual(c[4].height, c[5].height)
      : false,
    coronaTopGapEqualsInsideTopGap: c.length >= 2 && i.length >= 2
      ? nearlyEqual(c[1].x - (c[0].x + c[0].width), i[1].x - (i[0].x + i[0].width), 2.5)
      : false,
    coronaRadiusMatchesInside: c.length >= 1 && i.length >= 1 ? c[0].radius === i[0].radius : false,
  },
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
