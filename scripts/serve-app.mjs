// Local development/test server. Serves only the web-app directory.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";

const root = fileURLToPath(new URL("../ibo-scorer/", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
};
const port = Number(process.env.PORT || 4173);
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const path = resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const body = await readFile(path);
    response
      .writeHead(200, {
        "Content-Type":
          (types[extname(path)] || "application/octet-stream") +
          ([".html", ".js", ".mjs", ".css"].includes(extname(path))
            ? "; charset=utf-8"
            : ""),
        "Cache-Control": "no-cache",
      })
      .end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Archery app: http://127.0.0.1:${port}/`),
);
