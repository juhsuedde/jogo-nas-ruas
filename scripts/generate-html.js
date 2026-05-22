import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distClient = join(__dirname, "..", "dist", "client");
const serverEntryPath = join(__dirname, "..", "dist", "server", "index.js");

async function main() {
  const server = await import(serverEntryPath);
  const handler = server.default ?? server;
  const req = new Request("http://localhost/");
  const response = await handler.fetch(req, {}, {});
  const html = await response.text();
  writeFileSync(join(distClient, "index.html"), html);
  console.log("Generated dist/client/index.html (" + html.length + " bytes)");
}

main().catch((err) => {
  console.error("Failed to generate index.html:", err);
  process.exit(1);
});
