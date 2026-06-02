import { chromium } from "playwright-core";

const email = process.argv[2] || "isak@fordania.se";
const password = process.argv[3] || "Fordania2026!";
const out = process.argv[4] || ".screenshots/after-login.png";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Oinloggad → ska redirectas till /login
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  const afterGuard = page.url();

  // 2. Logga in
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const afterLogin = page.url();

  await page.screenshot({ path: out });
  console.log(JSON.stringify({ afterGuard, afterLogin }, null, 2));
} finally {
  await browser.close();
}
