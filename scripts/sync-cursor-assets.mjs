import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir =
  process.env.CURSOR_ASSETS_DIR ||
  "C:/Users/MONSTER/.cursor/projects/c-Users-MONSTER-Projects-V-Z-ER/assets";
const outDir = join(root, "public", "card-art");

mkdirSync(outDir, { recursive: true });
let copied = 0;
for (const name of readdirSync(assetsDir)) {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(name)) continue;
  const src = join(assetsDir, name);
  const dest = join(outDir, name.replace(/\.(png|webp)$/i, ".jpg"));
  copyFileSync(src, dest);
  copied++;
}
console.log(`Copied ${copied} asset(s) to ${outDir}`);
