import { chromium } from "playwright-core";

const url = process.argv[2];
const out = process.argv[3];
const clickText = process.argv[4]; // text på elementet att klicka

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  if (clickText) {
    await page.getByText(clickText, { exact: false }).first().click();
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: out });
  console.log("OK:", out);
} finally {
  await browser.close();
}
