import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const out = [];
    const wanted = ["Aktiva jobb", "Inplanerade", "VERKSTAD", "Verkstad", "Här är läget"];
    for (const el of document.querySelectorAll("p, span")) {
      const t = (el.textContent || "").trim();
      if (wanted.some((w) => t.startsWith(w)) && t.length < 40) {
        const s = getComputedStyle(el);
        out.push({ text: t.slice(0, 25), color: s.color, weight: s.fontWeight, font: s.fontFamily.slice(0, 30), opacity: s.opacity });
      }
      if (out.length >= 6) break;
    }
    // läs även tokenvärden
    const root = getComputedStyle(document.documentElement);
    return {
      samples: out,
      tokens: {
        mutedForeground: root.getPropertyValue("--muted-foreground").trim(),
        colorMutedForeground: root.getPropertyValue("--color-muted-foreground").trim(),
        foreground: root.getPropertyValue("--foreground").trim(),
      },
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
