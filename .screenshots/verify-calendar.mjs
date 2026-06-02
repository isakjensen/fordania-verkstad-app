import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  // Veckovy (standard)
  await page.goto("http://localhost:3000/planering", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".screenshots/cal-week.png" });
  // Dagvy
  await page.goto("http://localhost:3000/planering?view=day", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".screenshots/cal-day.png" });
  // Klicka en arbetsorder → drawer
  const box = page.locator('button[title]').filter({ hasText: /Service|Reparation|Däckbyte|Besiktning|Felsökning|Rekond/ }).first();
  if (await box.count()) {
    await box.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: ".screenshots/cal-drawer.png" });
  }
  console.log("klart");
} finally { await browser.close(); }
