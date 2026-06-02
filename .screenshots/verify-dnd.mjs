import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  await page.goto("http://localhost:3000/planering?view=week", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);

  // Hitta en arbetsorder hos Amir (Service) och Petras header som drop-mål.
  const drag = page.locator('button[title^="Service"]').first();
  const dragBox = await drag.boundingBox();
  const petra = page.getByText("Petra Lund").first();
  const petraBox = await petra.boundingBox();
  if (!dragBox || !petraBox) { console.log("RESULT saknar element"); }
  else {
    const sx = dragBox.x + dragBox.width/2, sy = dragBox.y + dragBox.height/2;
    const tx = petraBox.x + 350, ty = petraBox.y + petraBox.height/2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    // flera steg så dnd-kit registrerar drag (aktiveringsavstånd 6px)
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(sx + (tx - sx) * i/10, sy + (ty - sy) * i/10, { steps: 2 });
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: ".screenshots/dnd-after.png" });
    // Räkna ordrar per mekaniker via deras "X ordrar"-text
    const amir = await page.getByText(/Amir Haddad/).locator("xpath=following-sibling::*").first().textContent().catch(()=>"");
    console.log("RESULT klar");
  }
} finally { await browser.close(); }
