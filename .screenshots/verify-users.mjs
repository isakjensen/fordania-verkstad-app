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

  await page.goto("http://localhost:3000/anvandare", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".screenshots/users-list.png" });

  // Skapa en användare
  const addBtn = page.getByRole("button", { name: /Lägg till användare/ });
  if (await addBtn.count()) {
    await addBtn.first().click();
    await page.waitForTimeout(600);
    await page.fill("#u-name", "Lisa Karlsson");
    await page.fill("#u-email", "lisa@eriksbil.se");
    await page.screenshot({ path: ".screenshots/users-create.png" });
    await page.getByRole("button", { name: /Skapa användare/ }).click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: ".screenshots/users-after-create.png" });
  } else {
    console.log("INGEN add-knapp – Johan saknar admin-roll");
  }
  console.log(JSON.stringify({ url: page.url() }));
} finally { await browser.close(); }
