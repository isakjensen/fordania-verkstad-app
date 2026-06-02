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

  // 1. Redigera-användare-dialog: dropdown ska visa "Användare"/"Aktiv"
  await page.goto("http://localhost:3000/anvandare", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const row = page.locator("tr", { hasText: "Lisa Karlsson" });
  await row.getByRole("button", { name: /Redigera användare/ }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: ".screenshots/cui-edit-closed.png" });
  // Öppna roll-dropdown
  await page.locator('button[id^="eu-role-"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".screenshots/cui-dropdown-open.png" });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // 2. Date picker på fordon-detalj
  await page.goto("http://localhost:3000/fordon", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator('a[href^="/fordon/"]').first().click();
  await page.waitForURL(/\/fordon\/[^/]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.locator("#odo-date").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".screenshots/cui-datepicker.png" });
  console.log("klart");
} finally { await browser.close(); }
