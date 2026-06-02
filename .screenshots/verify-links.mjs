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

  // Skapa ett fordon med märke/modell
  await page.goto("http://localhost:3000/fordon", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Lägg till fordon/ }).first().click();
  await page.waitForTimeout(600);
  await page.fill("#v-reg", "XYZ 789");
  await page.fill("#v-chassis", "WAUZZZ8K9BA000099");
  await page.fill("#v-brand", "Audi");
  await page.fill("#v-model", "A4 Avant");
  await page.fill("#v-odo", "8200");
  await page.getByRole("button", { name: /Skapa fordon/ }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: ".screenshots/links-vehicles-list.png" });

  // Öppna en kund och koppla ett fordon
  await page.goto("http://localhost:3000/kunder", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1000);
  await page.locator('a[href^="/kunder/"]').first().click();
  await page.waitForURL(/\/kunder\/[^/]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  // Välj första fordon i select och koppla
  const sel = page.locator("select").first();
  await sel.selectOption({ index: 1 });
  await page.getByRole("button", { name: /^Koppla/ }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: ".screenshots/links-customer-detail.png", fullPage: true });

  const customerUrl = page.url();

  // Gå till det kopplade fordonet och se kunden där
  await page.locator('a[href^="/fordon/"]').first().click();
  await page.waitForURL(/\/fordon\/[^/]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".screenshots/links-vehicle-detail.png", fullPage: true });

  console.log(JSON.stringify({ customerUrl, vehicleUrl: page.url() }));
} finally {
  await browser.close();
}
