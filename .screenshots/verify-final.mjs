import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});

  // 1) Kunder: body ska inte scrolla, men main ska kunna scrolla
  await page.goto("http://localhost:3000/kunder", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const kunder = await page.evaluate(() => {
    const bodyScroll = document.documentElement.scrollHeight > document.documentElement.clientHeight + 2;
    const main = document.querySelector("main");
    const mainScrollable = main ? main.scrollHeight > main.clientHeight : false;
    return { bodyScroll, mainScrollable };
  });

  // 2) Drag i kalendern fungerar (flyttar en order)
  await page.goto("http://localhost:3000/planering?view=week", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const drag = page.locator('button[title^="Service"]').first();
  const dragBox = await drag.boundingBox();
  const niklas = page.getByText("Niklas Berg").first();
  const nBox = await niklas.boundingBox();
  let dragWorked = false;
  if (dragBox && nBox) {
    const sx = dragBox.x + dragBox.width/2, sy = dragBox.y + dragBox.height/2;
    const tx = nBox.x + 300, ty = nBox.y + nBox.height/2;
    await page.mouse.move(sx, sy); await page.mouse.down();
    for (let i=1;i<=8;i++){ await page.mouse.move(sx+(tx-sx)*i/8, sy+(ty-sy)*i/8,{steps:2}); await page.waitForTimeout(25);}
    await page.mouse.up();
    await page.waitForTimeout(800);
    const niklasText = await page.getByText("Niklas Berg").first().locator("xpath=..").textContent().catch(()=>"");
    dragWorked = /ordrar|order/.test(niklasText||"");
  }
  console.log("RESULT " + JSON.stringify({ kunder, dragWorked, pageErrors: errors.length }));
} finally { await browser.close(); }
