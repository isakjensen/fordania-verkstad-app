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
  await page.waitForURL(/superadmin/, { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/superadmin/tenants", {
    waitUntil: "networkidle",
    timeout: 40000,
  });
  await page.waitForTimeout(1500);

  // Öppna "Lägg till kund"-dialogen
  await page.getByRole("button", { name: /Lägg till kund/ }).click();
  await page.waitForTimeout(600);
  await page.fill("#name", "Demo Verkstad AB");
  await page.fill("#city", "Malmö");
  await page.getByRole("button", { name: /Skapa kund/ }).click();
  await page.waitForTimeout(2500);

  const visible = await page.getByText("Demo Verkstad AB").count();
  await page.screenshot({ path: ".screenshots/sa-created.png" });
  console.log(JSON.stringify({ newTenantVisible: visible > 0, url: page.url() }));
} finally {
  await browser.close();
}
