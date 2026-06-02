import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  // Logga in som superadmin
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "philip@fordania.se");
  await page.fill("#password", "Fordania2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL(/superadmin/, { timeout: 40000 }).catch(() => {});

  // Gå till kundregistret (verkstadsvy)
  await page.goto("http://localhost:3000/kunder", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);

  // Öppna tenant-väljaren för att se alla verkstäder
  await page.getByText(/Superadmin ·/).first().click().catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: ".screenshots/sa-switcher.png" });

  // Stäng och skapa en kund (verifierar att ingen redirect sker)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const hasAddBtn = await page.getByRole("button", { name: /Lägg till kund/ }).count();
  console.log(JSON.stringify({ url: page.url(), hasAddButton: hasAddBtn > 0 }));
} finally {
  await browser.close();
}
