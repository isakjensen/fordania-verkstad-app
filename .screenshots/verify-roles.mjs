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

  await page.goto("http://localhost:3000/anvandare", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".screenshots/roles-list.png" });

  // Öppna roll-dropdown i redigera-dialog (ska bara visa 2 roller)
  const row = page.locator("tr", { hasText: "Johan Sandberg" });
  await row.getByRole("button", { name: /Redigera användare/ }).click();
  await page.waitForTimeout(700);
  await page.locator('button[id^="eu-role-"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".screenshots/roles-dropdown.png" });
  console.log("klart");
} finally { await browser.close(); }
