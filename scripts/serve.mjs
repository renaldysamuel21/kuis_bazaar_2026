import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const output = path.join(process.cwd(), "out");
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function resolveFile(urlPath) {
  const pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(output, relative);
  if (!filePath.startsWith(path.resolve(output))) throw new Error("Unsafe path");
  return filePath;
}

createServer(async (request, response) => {
  try {
    let filePath = resolveFile(request.url);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": filePath.endsWith("sw.js") ? "no-cache" : "public, max-age=60",
    });
    response.end(body);
  } catch {
    try {
      const fallback = await readFile(path.join(output, "404.html"));
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(fallback);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Kuis Bazaar siap di http://127.0.0.1:${port}`);
});
