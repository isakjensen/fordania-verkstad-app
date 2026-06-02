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
  // Bekräfta att trigger-knappen har type=button (förhindrar form-submit)
  const triggerType = await page.locator("#odo-date").getAttribute("type");
  await page.locator("#odo-date").click({ force: true });
  await page.waitForTimeout(700);
  const errorShown = await page.getByText(/Ange en giltig mätarställning/).count();
  await page.screenshot({ path: ".screenshots/nojump.png" });
  console.log("RESULT " + JSON.stringify({ triggerType, errorOnOpen: errorShown }));
} finally { await browser.close(); }
