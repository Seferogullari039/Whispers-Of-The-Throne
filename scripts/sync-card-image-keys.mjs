import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const sceneData = JSON.parse(
  readFileSync(join(root, "data", "scene-descriptions.json"), "utf8"),
);

const cards = {};
for (const id of Object.keys(sceneData.cards)) {
  cards[id] = id;
}

const out = {
  cards,
  origins: {
    orphan: "orphan-origin",
    thief: "thief-origin",
    "dock-worker": "dock-worker-origin",
    "temple-acolyte": "temple-origin",
    "arena-fighter": "arena-origin",
  },
};

writeFileSync(
  join(root, "data", "card-image-keys.json"),
  JSON.stringify(out, null, 2) + "\n",
  "utf8",
);
console.log("Synced", Object.keys(cards).length, "card imageKeys (id = filename)");
