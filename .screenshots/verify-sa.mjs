import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "isak@fordania.se");
  await page.fill("#password", "Fordania2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  // vänta på redirect + first-compile av /superadmin
  await page.waitForURL(/superadmin/, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: ".screenshots/sa-overview.png" });
  console.log("overview-url:", page.url());

  // Användarvyn
  await page.goto("http://localhost:3000/superadmin/anvandare", {
    waitUntil: "networkidle",
    timeout: 40000,
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".screenshots/sa-users.png" });
  console.log("users-url:", page.url());
} finally {
  await browser.close();
}
