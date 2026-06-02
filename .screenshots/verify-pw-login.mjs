import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  // Logga in som Johan (tenant-admin)
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});

  await page.goto("http://localhost:3000/anvandare", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // Hitta Lisas rad och klicka nyckel-knappen (byt lösenord)
  const row = page.locator("tr", { hasText: "Lisa Karlsson" });
  await row.getByRole("button", { name: /Byt lösenord/ }).click();
  await page.waitForTimeout(600);
  // Skriv ett känt lösenord (override genererat)
  const pwInput = page.locator('input[id^="pw-"]');
  await pwInput.fill("TestLisa123");
  await page.getByRole("button", { name: /Spara lösenord/ }).click();
  await page.waitForTimeout(1800);

  // Logga ut Johan genom att rensa context-cookies
  await ctx.clearCookies();

  // Logga in som Lisa med det nya lösenordet
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "lisa@eriksbil.se");
  await page.fill("#password", "TestLisa123");
  const resp = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".screenshots/lisa-loggedin.png" });
  console.log(JSON.stringify({ signInStatus: resp[0].status(), finalUrl: page.url() }));
} finally { await browser.close(); }
