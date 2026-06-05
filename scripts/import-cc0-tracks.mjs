/**
 * One-off: import CC0 OpenGameArt tracks → public/audio/*.ogg + *.mp3
 */
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { copyFileSync, existsSync, mkdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createWriteStream } from "fs";
import { get as httpsGet } from "https";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE = join(__dirname, ".audio-cache-cc0");
const OUT = join(ROOT, "public", "audio");

const FFMPEG = require("ffmpeg-static");

const TRACKS = [
  {
    base: "origin-theme",
    title: "Medieval: The Old Tower Inn (Loop)",
    source: "https://opengameart.org/content/medieval-the-old-tower-inn",
    url: "https://opengameart.org/sites/default/files/Loop_The_Old_Tower_Inn.wav",
  },
  {
    base: "journey-streets",
    title: "Medieval: The Bard's Tale (Loop)",
    source: "https://opengameart.org/content/medieval-the-bards-tale",
    url: "https://opengameart.org/sites/default/files/Loop_The_Bards_Tale.wav",
  },
  {
    base: "journey-trade",
    title: "Medieval: Minstrel Dance",
    source: "https://opengameart.org/content/medieval-minstrel-dance",
    url: "https://opengameart.org/sites/default/files/Minstrel_Dance.mp3",
    trimSec: 85,
  },
  {
    base: "journey-throne",
    title: "Medieval: Exploration",
    source: "https://opengameart.org/content/medieval-exploration",
    url: "https://opengameart.org/sites/default/files/Exploration.mp3",
    trimSec: 88,
  },
  {
    base: "ending-bad",
    title: "Medieval: Defeat Theme",
    source: "https://opengameart.org/content/medieval-defeat-theme",
    url: "https://opengameart.org/sites/default/files/defeat.mp3",
  },
  {
    base: "ending-neutral",
    title: "Medieval: Harvest Season",
    source: "https://opengameart.org/content/medieval-harvest-season",
    url: "https://opengameart.org/sites/default/files/harvestseason.wav",
    trimSec: 52,
  },
  {
    base: "ending-good",
    title: "Medieval: Victory Theme",
    source: "https://opengameart.org/content/medieval-victory-theme",
    url: "https://opengameart.org/sites/default/files/victory.mp3",
  },
  {
    base: "ending-true",
    title: "Medieval: Rejoicing",
    source: "https://opengameart.org/content/medieval-rejoicing",
    url: "https://opengameart.org/sites/default/files/Rejoicing.mp3",
    trimSec: 56,
  },
];

function run(args) {
  const r = spawnSync(FFMPEG, args, { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`ffmpeg failed: ${args.join(" ")}`);
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      resolve(dest);
      return;
    }
    const file = createWriteStream(dest);
    httpsGet(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
    }).on("error", reject);
  });
}

function extFromUrl(url) {
  const m = url.match(/\.(\w+)(?:\?|$)/);
  return m ? `.${m[1]}` : ".bin";
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const sizes = [];

  for (const t of TRACKS) {
    const raw = join(CACHE, `${t.base}-source${extFromUrl(t.url)}`);
    console.log(`\n→ ${t.base}`);
    await download(t.url, raw);

    const work = join(CACHE, `${t.base}-work.wav`);
    const inputArgs = ["-y", "-hide_banner", "-loglevel", "error", "-i", raw];
    if (t.trimSec) inputArgs.push("-t", String(t.trimSec));
    inputArgs.push("-ar", "44100", "-ac", "2", work);
    run(inputArgs);

    const norm = join(CACHE, `${t.base}-norm.wav`);
    run([
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      work,
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      norm,
    ]);

    const ogg = join(OUT, `${t.base}.ogg`);
    const mp3 = join(OUT, `${t.base}.mp3`);
    run([
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      norm,
      "-c:a",
      "libvorbis",
      "-q:a",
      "4",
      "-ar",
      "44100",
      "-ac",
      "2",
      ogg,
    ]);
    run([
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      norm,
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      "-ac",
      "2",
      mp3,
    ]);

    const o = statSync(ogg).size;
    const m = statSync(mp3).size;
    sizes.push({ base: t.base, ogg: o, mp3: m });
    console.log(
      `  ✓ ogg ${(o / 1024 / 1024).toFixed(2)} MB · mp3 ${(m / 1024 / 1024).toFixed(2)} MB`,
    );
  }

  console.log("\n── Summary ──");
  for (const s of sizes) {
    console.log(
      `${s.base.padEnd(18)} ogg=${(s.ogg / 1024 / 1024).toFixed(2)} MB  mp3=${(s.mp3 / 1024 / 1024).toFixed(2)} MB`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
