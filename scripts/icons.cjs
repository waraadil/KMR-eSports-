/* Renders the KMR app icon at store-required sizes via headless chromium. */
const Chromium = require("@sparticuz/chromium").default;
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const svg = (px) => `
<svg viewBox="0 0 36 36" width="${px}" height="${px}">
  <path d="M18 1.5 33 10v16L18 34.5 3 26V10L18 1.5Z" fill="none" stroke="#d8ff3e" stroke-width="2" stroke-linejoin="round"/>
  <path d="M12 9v18M12 17.5 22 9M13.6 16.4 23 27" fill="none" stroke="#d8ff3e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const page = (size, logoPx, maskGlow) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:#07070c;display:grid;place-items:center;overflow:hidden;${
  maskGlow ? "background-image:radial-gradient(circle at 50% 35%, rgba(216,255,62,.16), transparent 60%);" : ""
}">${svg(logoPx)}</body></html>`;

(async () => {
  fs.mkdirSync("public/icons", { recursive: true });
  const browser = await puppeteer.launch({
    args: [...Chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: await Chromium.executablePath(),
    headless: "shell",
    env: { ...process.env, LD_LIBRARY_PATH: `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}` },
  });
  const p = await browser.newPage();

  const jobs = [
    { file: "icon-512.png", size: 512, logo: 330, glow: true },
    { file: "icon-192.png", size: 192, logo: 124, glow: true },
    { file: "icon-maskable-512.png", size: 512, logo: 270, glow: true },
    { file: "apple-touch-icon.png", size: 180, logo: 116, glow: true },
  ];

  for (const j of jobs) {
    await p.setViewport({ width: j.size, height: j.size, deviceScaleFactor: 1 });
    await p.setContent(page(j.size, j.logo, j.glow), { waitUntil: "load" });
    await p.screenshot({ path: `public/icons/${j.file}` });
    console.log("✔", j.file);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
