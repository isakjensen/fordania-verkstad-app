import { chromium } from "playwright-core";

const url = process.argv[2] || "http://localhost:3000/";
const out = process.argv[3] || ".screenshots/dashboard.png";
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 1000);

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1800); // låt motion-animationer spela klart
  await page.screenshot({ path: out, fullPage: true });
  console.log("OK:", out);
} finally {
  await browser.close();
}
