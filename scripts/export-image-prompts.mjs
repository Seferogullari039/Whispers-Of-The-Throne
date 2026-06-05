import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const imageKeyData = JSON.parse(
  readFileSync(join(root, "data", "card-image-keys.json"), "utf8"),
);
const sceneData = JSON.parse(
  readFileSync(join(root, "data", "scene-descriptions.json"), "utf8"),
);

const templateSrc = readFileSync(
  join(root, "lib", "imagePromptTemplate.ts"),
  "utf8",
);
const templateMatch = templateSrc.match(
  /IMAGE_STYLE_TEMPLATE\s*=\s*`([^`]+)`/s,
);
if (!templateMatch) {
  throw new Error(
    "Could not parse IMAGE_STYLE_TEMPLATE from lib/imagePromptTemplate.ts",
  );
}
const IMAGE_STYLE_TEMPLATE = templateMatch[1].trim();

function buildPrompt(sceneDescription) {
  const scene = (sceneDescription ?? "").trim();
  if (!scene) return IMAGE_STYLE_TEMPLATE;
  return `${IMAGE_STYLE_TEMPLATE} ${scene}`;
}

function filenameFor(imageKey) {
  if (!imageKey) return null;
  return `${imageKey}.jpg`;
}

const entries = [];

for (const [id, sceneDescription] of Object.entries(sceneData.cards)) {
  const imageKey = imageKeyData.cards[id];
  if (!imageKey) {
    console.warn(`Warning: no imageKey for card ${id}`);
    continue;
  }
  entries.push({
    type: "card",
    id,
    imageKey,
    filename: filenameFor(imageKey),
    prompt: buildPrompt(sceneDescription),
  });
}

for (const [id, meta] of Object.entries(sceneData.origins)) {
  entries.push({
    type: "origin",
    id,
    imageKey: meta.imageKey,
    filename: filenameFor(meta.imageKey),
    prompt: buildPrompt(meta.sceneDescription),
  });
}

for (const [id, meta] of Object.entries(sceneData.endings)) {
  entries.push({
    type: "ending",
    id,
    imageKey: meta.imageKey ?? null,
    filename: filenameFor(meta.imageKey),
    prompt: buildPrompt(meta.sceneDescription),
  });
}

const outDir = join(root, "public", "card-art");
const jsonPath = join(outDir, "generated-prompts.json");
writeFileSync(jsonPath, JSON.stringify(entries, null, 2), "utf8");

const uniqueByFile = new Map();
for (const item of entries) {
  if (!item.filename) continue;
  if (!uniqueByFile.has(item.filename)) {
    uniqueByFile.set(item.filename, {
      filename: item.filename,
      imageKey: item.imageKey,
      prompt: item.prompt,
      usedBy: [],
    });
  }
  uniqueByFile.get(item.filename).usedBy.push(`${item.type}:${item.id}`);
}

const uniquePath = join(outDir, "unique-assets.json");
writeFileSync(
  uniquePath,
  JSON.stringify([...uniqueByFile.values()], null, 2),
  "utf8",
);

const mdLines = [
  IMAGE_STYLE_TEMPLATE,
  "",
  "",
];

for (const item of entries) {
  mdLines.push(`${item.type}: ${item.id}`);
  mdLines.push("");
  mdLines.push(`File: ${item.filename ?? "(no imageKey)"}`);
  mdLines.push("");
  mdLines.push("Prompt:");
  mdLines.push("");
  mdLines.push(item.prompt);
  mdLines.push("");
  mdLines.push("");
}

const mdPath = join(outDir, "generated-prompts.md");
writeFileSync(mdPath, mdLines.join("\n"), "utf8");

console.log(`Wrote ${entries.length} prompts (${uniqueByFile.size} unique files)`);
console.log(jsonPath);
console.log(uniquePath);
console.log(mdPath);
