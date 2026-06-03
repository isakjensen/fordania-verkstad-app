import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 940 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/planering?view=week", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  // Body ska INTE kunna scrolla (ingen dubbel scroll)
  const bodyScrollable = await page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight + 2);
  // Kalenderns rutnät SKA kunna scrolla
  const gridScrollable = await page.evaluate(() => {
    const el = document.querySelector('[data-slot="sheet"]') ? null : document.querySelector('.overflow-auto');
    return null; // platshållare
  });
  await page.screenshot({ path: ".screenshots/scroll-week.png" });
  console.log("RESULT " + JSON.stringify({ bodyScrollable }));
} finally { await browser.close(); }
