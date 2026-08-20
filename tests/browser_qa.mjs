import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "..");
const defaultHtml = path.join(root, "docs", "index.html");
const defaultUrl = pathToFileURL(defaultHtml).href;
const outputDir = path.join(root, "test_artifacts", "screenshots");
const urlIndex = process.argv.indexOf("--url");
const targetUrl = urlIndex >= 0 ? process.argv[urlIndex + 1] : defaultUrl;
const browserIndex = process.argv.indexOf("--browser");
const requestedBrowser = browserIndex >= 0 ? process.argv[browserIndex + 1] : null;

const browserChannels = requestedBrowser ? [requestedBrowser] : ["chrome", "msedge"];
const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function completeRequiredClinicalInputs(page) {
  await page.locator("#ed-days").fill("0");
  await page.locator('input[name="nasal_polyps"][value="0"]').check();
  await page.locator("#gina-step").selectOption("1");
  await page.locator('input[name="female"][value="0"]').check();
  await page.locator('input[name="breathing_pattern_disorder"][value="0"]').check();
  await page.locator("#smoking-status").selectOption("never");
}

async function exerciseCalculator(page) {
  expect((await page.title()) === "High Mucus Plug Burden Calculator", "Unexpected document title");
  await page.locator("#calculate-button").click();
  expect(await page.locator("#form-summary-error").isVisible(), "Missing-input summary was not shown");

  await completeRequiredClinicalInputs(page);
  await page.locator("#calculate-button").click();
  expect((await page.locator("#clinical-probability").textContent()).trim() === "6.6%", "Clinical-only display mismatch");
  expect((await page.locator("#mmef-probability").textContent()).trim() === "—", "MMEF result should be unavailable");
  expect((await page.locator("#mmef-result-note").textContent()).includes("Enter MMEF"), "Missing-MMEF instruction absent");

  await page.locator("#mmef").fill("60");
  await page.locator("#calculate-button").click();
  expect((await page.locator("#clinical-probability").textContent()).trim() === "6.6%", "Clinical result changed after MMEF entry");
  expect((await page.locator("#mmef-probability").textContent()).trim() === "6.6%", "MMEF display mismatch");
  expect((await page.locator("#probability-difference").textContent()).includes("+0.0 percentage points"), "Difference display mismatch");

  await page.locator("#mmef").fill("201");
  await page.locator("#calculate-button").click();
  expect(await page.locator("#mmef-warning").isVisible(), "MMEF >200 verification warning absent");
  expect((await page.locator("#mmef-probability").textContent()).trim() !== "—", "MMEF >200 should remain calculable");

  await page.locator("#model-information").evaluate((element) => { element.open = true; });
  await page.locator("#model-equations").evaluate((element) => { element.open = true; });
  await page.locator("#model-information").evaluate((element) => { element.open = false; });
  await page.locator("#model-equations").evaluate((element) => { element.open = false; });

  await page.locator("#reset-button").click();
  expect((await page.locator("#ed-days").inputValue()) === "", "Reset did not clear ED");
  expect((await page.locator("#gina-step").inputValue()) === "", "Reset did not clear GINA");
  expect((await page.locator("#clinical-probability").textContent()).trim() === "—", "Reset did not clear result");
}

async function runBrowser(channel) {
  const browser = await chromium.launch({ channel, headless: true });
  const browserResult = { channel, viewports: [] };
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      const requests = [];
      page.on("request", (request) => requests.push(request.url()));
      await page.goto(targetUrl, { waitUntil: "load" });
      await exerciseCalculator(page);
      await completeRequiredClinicalInputs(page);
      await page.locator("#mmef").fill("60");
      await page.locator("#calculate-button").click();
      const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(layout.documentWidth <= layout.viewportWidth, `${channel} ${viewport.name} has horizontal overflow`);
      expect(layout.bodyWidth <= layout.viewportWidth, `${channel} ${viewport.name} body has horizontal overflow`);
      const nonDocumentRequests = requests.filter((requestUrl) => requestUrl !== targetUrl);
      expect(nonDocumentRequests.length === 0, `${channel} made external/subresource requests: ${nonDocumentRequests.join(", ")}`);
      const screenshot = path.join(outputDir, `${channel}-${viewport.name}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      browserResult.viewports.push({ ...viewport, layout, requests: requests.length, screenshot });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return browserResult;
}

fs.mkdirSync(outputDir, { recursive: true });
const results = [];
for (const channel of browserChannels) {
  results.push(await runBrowser(channel));
}
const report = { targetUrl, browsers: results, pass: true };
const reportPath = path.join(root, "test_artifacts", "browser_qa.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
