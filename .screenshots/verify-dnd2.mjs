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

  const drag = page.locator('button[title^="Reparation"]').first();
  const dragBox = await drag.boundingBox();
  const niklas = page.getByText("Niklas Berg").first();
  const nBox = await niklas.boundingBox();
  if (dragBox && nBox) {
    const sx = dragBox.x + dragBox.width/2, sy = dragBox.y + dragBox.height/2;
    const tx = nBox.x + 300, ty = nBox.y + nBox.height/2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(sx + (tx-sx)*i/8, sy + (ty-sy)*i/8, { steps: 2 });
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    // Snabb bild – optimistisk uppdatering ska synas direkt
    await page.waitForTimeout(500);
    await page.screenshot({ path: ".screenshots/dnd-fast.png" });
  }
  console.log("klart");
} finally { await browser.close(); }
