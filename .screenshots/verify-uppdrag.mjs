import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "petra.eriks-biluthyrning@verkstad.se");
  await page.fill("#password", "Mekaniker2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/dagens-uppdrag", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".screenshots/uppdrag.png", fullPage: true });
  console.log("klart");
} finally { await browser.close(); }
