import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/fordon", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator('a[href^="/fordon/"]').first().click();
  await page.waitForURL(/\/fordon\/[^/]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const before = await page.locator("#odo-date").boundingBox();
  const kmBefore = await page.locator("#odo-value").boundingBox();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const bodyPadBefore = await page.evaluate(() => getComputedStyle(document.body).paddingRight);
  await page.locator("#odo-date").click({ force: true });
  await page.waitForTimeout(700);
  const after = await page.locator("#odo-date").boundingBox();
  const kmAfter = await page.locator("#odo-value").boundingBox();
  const scrollAfter = await page.evaluate(() => window.scrollY);
  const bodyPadAfter = await page.evaluate(() => getComputedStyle(document.body).paddingRight);
  const htmlOverflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  console.log("RESULT " + JSON.stringify({
    dateY: { before: before?.y, after: after?.y },
    kmY: { before: kmBefore?.y, after: kmAfter?.y },
    scroll: { before: scrollBefore, after: scrollAfter },
    bodyPadRight: { before: bodyPadBefore, after: bodyPadAfter },
    htmlOverflow,
  }));
} finally { await browser.close(); }
