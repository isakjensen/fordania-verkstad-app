import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "amir.eriks-biluthyrning@verkstad.se");
  await page.fill("#password", "Mekaniker2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/planering?view=week", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  const hint = await page.getByText(/kan se schemat men inte ändra/).count();
  // Kolla att en box INTE har cursor-grab (drag av)
  const box = page.locator('button[title]').first();
  const cursor = await box.evaluate((el) => getComputedStyle(el).cursor).catch(()=>"?");
  await page.screenshot({ path: ".screenshots/member-view.png" });
  console.log("RESULT " + JSON.stringify({ viewOnlyHint: hint>0, boxCursor: cursor }));
} finally { await browser.close(); }
