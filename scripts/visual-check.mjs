import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
const output = path.join(root, "out");
const screenshots = path.join(root, ".artifacts", "screenshots");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const resolved = path.resolve(output, relative);
  if (!resolved.startsWith(path.resolve(output))) throw new Error("Unsafe path");
  return resolved;
}

const server = createServer(async (request, response) => {
  try {
    let filePath = safeFilePath(request.url || "/");
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": filePath.endsWith("sw.js") ? "no-cache" : "public, max-age=60",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));
await mkdir(screenshots, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const viewports = [
  { name: "compact-320x568", width: 320, height: 568 },
  { name: "android-360x800", width: 360, height: 800 },
  { name: "iphone-390x844", width: 390, height: 844 },
  { name: "android-412x915", width: 412, height: 915 },
  { name: "iphone-430x932", width: 430, height: 932 },
  { name: "landscape-932x430", width: 932, height: 430 },
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Ayo main!" }).waitFor();
    await page.waitForTimeout(350);
    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${viewport.name} overflow horizontal`);
    await page.screenshot({ path: path.join(screenshots, `${viewport.name}-home.png`), fullPage: true });
    await page.getByRole("button", { name: /Tebak Tokoh/ }).click();
    await page.getByRole("heading", { level: 2 }).waitFor();
    assert.equal(await page.getByText(/^Ronde \d/).count(), 0, `${viewport.name} tidak menampilkan nomor ronde`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshots, `${viewport.name}-question.png`), fullPage: true });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  assert.equal(await page.getByText("Soal tersimpan di perangkat").count(), 0);
  await page.getByRole("button", { name: /Tebak Tokoh/ }).click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Lihat jawaban" }).click();
    await page.getByRole("button", { name: "Benar", exact: true }).click();
    if (index === 0) {
      await page.getByRole("button", { name: "Kembali", exact: true }).click();
      await page.getByText("Jawaban anak tadi:").waitFor();
      await page.getByRole("button", { name: "Benar", exact: true }).click();
    }
    await page.getByRole("button", { name: index === 2 ? "Lihat hasil ronde" : "Soal berikutnya" }).click();
  }
  await page.getByText("10", { exact: true }).waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(screenshots, "round-result-10.png"), fullPage: true });
  await page.getByRole("button", { name: "Kembali ke menu utama" }).click();
  await page.getByRole("button", { name: /Benar \/ Salah/ }).click();

  const statement = (await page.getByRole("heading", { level: 2 }).textContent())?.trim();
  const data = JSON.parse(await readFile(path.join(root, "src", "data", "questions.json"), "utf8"));
  const question = data.trueFalseQuestions.find((item) => item.statement === statement);
  assert.ok(question, "Pernyataan Benar/Salah ditemukan di bank soal");
  await page.getByRole("button", { name: question.answer ? "Salah" : "Benar", exact: true }).click();
  await page.locator(".game-screen--wrong").waitFor();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await page.locator(".game-screen--wrong").waitFor({ state: "detached" });
  await page.getByRole("button", { name: question.answer ? "Salah" : "Benar", exact: true }).click();
  await page.locator(".game-screen--wrong").waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshots, "true-false-wrong.png"), fullPage: true });

  await page.getByRole("button", { name: "Soal berikutnya" }).click();
  await page.locator(".question-meta span").first().filter({ hasText: "Soal 2" }).waitFor();
  const secondStatement = (await page.getByRole("heading", { level: 2 }).textContent())?.trim();
  const secondQuestion = data.trueFalseQuestions.find((item) => item.statement === secondStatement);
  assert.ok(secondQuestion, "Soal kedua Benar/Salah ditemukan");
  await page.getByRole("button", { name: secondQuestion.answer ? "Benar" : "Salah", exact: true }).click();
  await page.locator(".game-screen--correct").waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshots, "true-false-correct.png"), fullPage: true });

  await page.getByRole("button", { name: "Soal berikutnya" }).click();
  await page.locator(".question-meta span").first().filter({ hasText: "Soal 3" }).waitFor();
  const thirdStatement = (await page.getByRole("heading", { level: 2 }).textContent())?.trim();
  const thirdQuestion = data.trueFalseQuestions.find((item) => item.statement === thirdStatement);
  assert.ok(thirdQuestion, "Soal ketiga Benar/Salah ditemukan");
  await page.getByRole("button", { name: thirdQuestion.answer ? "Salah" : "Benar", exact: true }).click();
  await page.getByRole("button", { name: "Lihat hasil ronde" }).click();
  await page.locator(".result-screen").waitFor();
  const fivePointResult = (await page.locator(".points-pill strong").textContent())?.trim();
  assert.equal(fivePointResult, "5", "Satu jawaban benar menghasilkan 5 poin");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshots, "round-result-5.png"), fullPage: true });

  await page.getByRole("button", { name: "Kembali ke menu utama" }).click();
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 10_000 });
  const cacheNames = await page.evaluate(() => caches.keys());
  assert.ok(cacheNames.some((name) => name.startsWith("kuis-bazaar-")), "Cache PWA tersedia");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Ayo main!" }).waitFor();
  await context.setOffline(false);
  await context.close();

  console.log(`Visual checks passed for ${viewports.length} smartphone viewports.`);
  console.log("Round flow, green/red answer states, both point animations, PWA cache, and offline reload passed.");
  console.log(screenshots);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
