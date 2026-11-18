/* Screenshot harness for KMR eSports (dev tooling, not shipped) */
const Chromium = require("@sparticuz/chromium").default;
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const OUT = "screenshots";
const LIB_PATH = "/tmp/al2023/lib";

/** al2023 system libs were extracted via shell (brotli + tar) into /tmp/al2023. */
async function ensureLibs() {
  if (!fs.existsSync(path.join(LIB_PATH, "libnspr4.so"))) {
    throw new Error("Extract al2023.tar.br to /tmp/al2023 first (see git history)");
  }
}

async function settle(page, ms = 2200) {
  await new Promise((r) => setTimeout(r, ms));
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
}

async function shot(page, url, name, { fullPage = true, cookie } = {}) {
  if (cookie) await page.setCookie(cookie);
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle(page);
  await scrollThrough(page);
  await settle(page, 1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("✔", name);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await ensureLibs();
  const browser = await puppeteer.launch({
    args: [...Chromium.args, "--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
    executablePath: await Chromium.executablePath(),
    headless: "shell",
    defaultViewport: { width: 1440, height: 900 },
    env: { ...process.env, LD_LIBRARY_PATH: `${LIB_PATH}:${process.env.LD_LIBRARY_PATH || ""}` },
  });

  const page = await browser.newPage();

  // public pages
  await shot(page, "/", "01-home");
  await shot(page, "/tournaments", "02-tournaments");
  await shot(page, "/tournaments/bgmi-winter-clash-championship", "03-tournament-detail");
  await shot(page, "/tournaments/codm-sniper-only-showdown", "04-tournament-live");
  await shot(page, "/leaderboard", "05-leaderboard");
  await shot(page, "/login", "06-login");

  // demo user session
  const res = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "demo@kmr.gg", password: "Demo@1234" }),
  });
  const setCookie = res.headers.get("set-cookie");
  const m = setCookie && setCookie.match(/kmr_session=([^;]+)/);
  if (!m) throw new Error("login failed");
  const sessionCookie = {
    name: "kmr_session",
    value: m[1],
    domain: "localhost",
    path: "/",
  };

  await shot(page, "/dashboard", "07-dashboard", { cookie: sessionCookie });

  // registration modal on a paid tournament
  await page.goto(BASE + "/tournaments/valorant-neon-nights-premier", { waitUntil: "networkidle0" });
  await settle(page);
  // click the register button by text
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /register & pay/i.test(x.textContent || ""));
    if (b) b.click();
  });
  await settle(page, 900);
  await page.screenshot({ path: `${OUT}/08-checkout-form.png` });
  console.log("✔ 08-checkout-form");

  // fill IGN and continue to mock gateway
  await page.evaluate(() => {
    const input = document.querySelector("input.input");
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "DemoSlayer");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  async function typeIgn() {
    const el = await page.$("input.input");
    if (el) await el.type("DemoSlayer", { delay: 20 });
  }
  await typeIgn();
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /continue to payment/i.test(x.textContent || ""));
    if (b) b.click();
  });
  await settle(page, 1600);
  await page.screenshot({ path: `${OUT}/09-gateway.png` });
  console.log("✔ 09-gateway");

  // pay (mock) and capture success
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /^pay /i.test((x.textContent || "").trim()));
    if (b) b.click();
  });
  await settle(page, 4500);
  await page.screenshot({ path: `${OUT}/10-payment-success.png` });
  console.log("✔ 10-payment-success");

  // admin
  const resA = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin@kmr.gg", password: "Admin@123" }),
  });
  const sc = resA.headers.get("set-cookie");
  const ma = sc && sc.match(/kmr_session=([^;]+)/);
  await shot(page, "/admin", "11-admin", {
    cookie: { name: "kmr_session", value: ma[1], domain: "localhost", path: "/" },
  });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
