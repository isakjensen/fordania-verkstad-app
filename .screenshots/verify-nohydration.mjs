import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "johan@eriksbil.se");
  await page.fill("#password", "Verkstad2026!");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 }).catch(() => {});
  errors.length = 0; // nollställ efter login
  await page.goto("http://localhost:3000/planering?view=day", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(2000);
  const hydration = errors.filter((e) => /hydrat|did not match|describedby/i.test(e));
  console.log("RESULT " + JSON.stringify({ totalErrors: errors.length, hydrationErrors: hydration.length, sample: errors.slice(0,3) }));
} finally { await browser.close(); }
