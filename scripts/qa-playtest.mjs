/**
 * One-off QA: 3 unique origins × ~25 swipes each.
 * Usage: node scripts/qa-playtest.mjs
 */
import { chromium } from "playwright";

const BASE_URL = process.env.PLAYTEST_URL ?? "http://localhost:3000";
const CHOICES_PER_RUN = 25;
const ORIGIN_RUNS = 3;

async function swipe(page, direction) {
  const el = page.locator(".story-card-drag");
  if ((await el.count()) === 0) return false;
  const box = await el.boundingBox();
  if (!box) return false;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * 0.45;
  const delta = direction === "right" ? 130 : -130;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + delta, cy, { steps: 12 });
  await page.mouse.up();
  return true;
}

async function clickIfVisible(page, name) {
  const btn = page.getByRole("button", { name });
  try {
    if (await btn.isVisible({ timeout: 400 })) {
      await btn.click();
      return true;
    }
  } catch {
    /* not visible */
  }
  return false;
}

async function readOrigin(page) {
  const h2 = page.locator("section h2").first();
  if (await h2.isVisible({ timeout: 1000 }).catch(() => false)) {
    return (await h2.textContent())?.trim() ?? null;
  }
  return null;
}

async function playChoices(page, maxChoices) {
  const cards = [];
  let choices = 0;

  for (let step = 0; step < 400 && choices < maxChoices; step++) {
    await page.waitForTimeout(350);

    if (await clickIfVisible(page, "Devam Et")) {
      await page.waitForTimeout(450);
      continue;
    }
    if (await clickIfVisible(page, "Başla")) {
      await page.waitForTimeout(450);
      continue;
    }
    if (await clickIfVisible(page, "Yeniden Başla")) {
      break;
    }

    const titleEl = page.locator("article h2");
    if (!(await titleEl.isVisible({ timeout: 400 }).catch(() => false))) {
      continue;
    }

    const title = (await titleEl.textContent())?.trim() ?? "?";
    const dir = choices % 2 === 0 ? "right" : "left";
    if (!(await swipe(page, dir))) break;

    cards.push(title);
    choices++;
    await page.waitForTimeout(550);
  }

  const statusLine = await page
    .locator("p")
    .filter({ hasText: /Seviye|Hamle|Bölüm/ })
    .first()
    .textContent()
    .catch(() => null);

  return { choices, cards, statusLine: statusLine?.trim() ?? null };
}

async function freshLoad(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const seenOrigins = new Set();
  const runs = [];
  let attempts = 0;

  while (runs.length < ORIGIN_RUNS && attempts < 30) {
    attempts++;
    await freshLoad(page);
    await page.waitForSelector('button:has-text("Başla")', { timeout: 10000 });

    const origin = await readOrigin(page);
    if (!origin || seenOrigins.has(origin)) continue;

    seenOrigins.add(origin);
    await page.getByRole("button", { name: "Başla" }).click();
    await page.waitForTimeout(500);

    const result = await playChoices(page, CHOICES_PER_RUN);
    runs.push({ origin, ...result });
    console.log(
      JSON.stringify({ run: runs.length, origin, choices: result.choices }),
    );
  }

  await browser.close();

  const report = {
    url: BASE_URL,
    targetOrigins: ORIGIN_RUNS,
    choicesPerRun: CHOICES_PER_RUN,
    attempts,
    runs,
  };
  console.log("\n=== QA REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  process.exit(runs.length < ORIGIN_RUNS ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
