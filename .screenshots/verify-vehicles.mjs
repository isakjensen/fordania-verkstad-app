import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  // Logga in som tenant-admin (Johan på Eriks Biluthyrning)
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});

  // 1. Inställningar – lägg till ett dynamiskt fordonsfält "Färg"
  await page.goto("http://localhost:3000/installningar", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1200);
  await page.fill("#new-field-label", "Färg");
  await page.getByRole("button", { name: /Lägg till/ }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: ".screenshots/vehicle-settings.png" });

  // 2. Fordon – skapa ett fordon med dynamiska fält + mätarställning
  await page.goto("http://localhost:3000/fordon", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Lägg till fordon/ }).first().click();
  await page.waitForTimeout(600);
  await page.fill("#v-reg", "ABC 123");
  await page.fill("#v-chassis", "WVWZZZ1KZAW000001");
  // Dynamiska fält fylls via deras label
  const colorInput = page.locator('input[id^="field_"]').last();
  await colorInput.fill("Svart");
  await page.fill("#v-odo", "12500");
  await page.getByRole("button", { name: /Skapa fordon/ }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".screenshots/vehicles-list.png" });

  // 3. Öppna fordonet – detaljvy med mätarställning
  await page.locator('a[href^="/fordon/"]').first().click();
  await page.waitForURL(/\/fordon\/[^/]+$/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".screenshots/vehicle-detail.png", fullPage: true });

  // 4. Lägg till en ny mätarställning (historik)
  await page.fill("#odo-value", "13100");
  await page.getByRole("button", { name: /^Spara/ }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".screenshots/vehicle-odometer.png", fullPage: true });

  console.log(JSON.stringify({ url: page.url() }));
} finally {
  await browser.close();
}
