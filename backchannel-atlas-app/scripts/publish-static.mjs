import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const appRoot = resolve(new URL("..", import.meta.url).pathname);
const repoRoot = resolve(appRoot, "..");
const exportedBase = join(appRoot, "out");
const target = join(repoRoot, "france-money-map");

if (!existsSync(join(exportedBase, "index.html")) || !existsSync(join(exportedBase, "_next"))) {
  throw new Error(`Missing static export at ${exportedBase}. Run next build first.`);
}

await rm(target, { recursive: true, force: true });
await cp(exportedBase, target, { recursive: true });

console.log(`Published static export to ${target}`);
