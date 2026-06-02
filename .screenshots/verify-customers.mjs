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

  // Gå till kundregistret
  await page.goto("http://localhost:3000/kunder", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);

  // Skapa en kund
  await page.getByRole("button", { name: /Lägg till kund/ }).first().click();
  await page.waitForTimeout(600);
  await page.fill("#c-name", "Anna Andersson");
  await page.fill("#c-pnr", "19900101-1234");
  await page.fill("#c-phone", "070-123 45 67");
  await page.fill("#c-email", "anna@exempel.se");
  await page.fill("#c-address", "Storgatan 1, 411 01 Göteborg");
  await page.getByRole("button", { name: /Skapa kund/ }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".screenshots/customers-list.png" });

  // Öppna kunden
  await page.getByText("Anna Andersson").first().click();
  await page.waitForURL(/\/kunder\//, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Lägg en kommentar
  await page.fill("textarea", "Hyrde Volvo XC60 förra veckan. Trevlig kund.");
  await page.getByRole("button", { name: /Lägg till/ }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: ".screenshots/customer-detail.png" });

  console.log(JSON.stringify({ url: page.url() }));
} finally {
  await browser.close();
}
