import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("#email", "isak@fordania.se");
  await page.fill("#password", "Fordania2026!");

  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);

  const setCookie = resp.headers()["set-cookie"];
  await page.waitForTimeout(1500);
  const cookies = await page.context().cookies();

  console.log(JSON.stringify({
    signInStatus: resp.status(),
    setCookieHeader: setCookie ? setCookie.slice(0, 200) : null,
    browserCookies: cookies.map((c) => ({ name: c.name, secure: c.secure, httpOnly: c.httpOnly, domain: c.domain })),
    finalUrl: page.url(),
  }, null, 2));
} finally {
  await browser.close();
}
