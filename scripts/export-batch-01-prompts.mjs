import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const prompts = JSON.parse(
  readFileSync(join(root, "public", "card-art", "generated-prompts.json"), "utf8"),
);

const templateSrc = readFileSync(
  join(root, "lib", "imagePromptTemplate.ts"),
  "utf8",
);
const IMAGE_STYLE_TEMPLATE = templateSrc
  .match(/IMAGE_STYLE_TEMPLATE\s*=\s*`([^`]+)`/s)[1]
  .trim();

function cardActsInclude1(id) {
  const cardsTs = readFileSync(join(root, "data", "cards.ts"), "utf8");
  const blockRe = new RegExp(
    `id: "${id}"[\\s\\S]*?act: (\\[[^\\]]+\\])`,
  );
  const m = cardsTs.match(blockRe);
  if (!m) return false;
  return m[1].includes("1");
}

function fallbackActsInclude1(id) {
  const fb = readFileSync(join(root, "data", "fallbackCards.ts"), "utf8");
  const blockRe = new RegExp(
    `id: "${id}"[\\s\\S]*?act: (\\[[^\\]]+\\])`,
  );
  const m = fb.match(blockRe);
  if (!m) return false;
  return m[1].includes("1");
}

const originOrder = [
  "orphan",
  "thief",
  "dock-worker",
  "temple-acolyte",
  "arena-fighter",
];

const origins = originOrder
  .map((id) => prompts.find((p) => p.type === "origin" && p.id === id))
  .filter(Boolean);

const cardIdsFromDeck = [
  ...Object.keys(
    JSON.parse(
      readFileSync(join(root, "data", "scene-descriptions.json"), "utf8"),
    ).cards,
  ),
].filter((id) => cardActsInclude1(id));

const fallbackIds = ["interlude-quiet-dawn"].filter((id) =>
  fallbackActsInclude1(id),
);

const allCardIds = [...new Set([...cardIdsFromDeck, ...fallbackIds])];

const cards = allCardIds
  .map((id) => prompts.find((p) => p.type === "card" && p.id === id))
  .filter(Boolean);

const lines = [
  "# Batch 01 — Köken + Bölüm I (seviye 0–19)",
  "",
  "İlk test görselleri. Çıktı: `public/card-art/{File}`",
  "",
  IMAGE_STYLE_TEMPLATE,
  "",
  "",
];

for (const item of origins) {
  lines.push(`origin: ${item.id}`);
  lines.push("");
  lines.push(`File: ${item.filename}`);
  lines.push("");
  lines.push("Prompt:");
  lines.push("");
  lines.push(item.prompt);
  lines.push("");
  lines.push("");
}

for (const item of cards) {
  lines.push(`card: ${item.id}`);
  lines.push("");
  lines.push(`File: ${item.filename}`);
  lines.push("");
  lines.push("Prompt:");
  lines.push("");
  lines.push(item.prompt);
  lines.push("");
  lines.push("");
}

const outPath = join(root, "public", "card-art", "batch-01-prompts.md");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(
  `Wrote batch-01: ${origins.length} origins, ${cards.length} cards → ${outPath}`,
);
