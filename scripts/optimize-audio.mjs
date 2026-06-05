/**
 * WAV → OGG (Vorbis) + MP3 for web delivery.
 * Requires ffmpeg in PATH or the ffmpeg-static npm package.
 */

import { spawnSync } from "child_process";
import { createRequire } from "module";
import { existsSync, readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

const TRACKS = [
  "test-tone",
  "intro-theme",
  "menu-theme",
  "act-1-ashes",
  "act-2-whispers",
  "act-3-shadows",
  "act-4-seals",
  "act-5-throne",
];

const OGG_ARGS = ["-c:a", "libvorbis", "-q:a", "5", "-ar", "44100", "-ac", "2"];
/** Higher bitrate + no replaygain stripping — preserves low/mid body after encode */
const MP3_ARGS = [
  "-c:a",
  "libmp3lame",
  "-b:a",
  "160k",
  "-ar",
  "44100",
  "-ac",
  "2",
  "-q:a",
  "2",
];

function findFfmpeg() {
  const pathCheck = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (pathCheck.status === 0) {
    return { bin: "ffmpeg", source: "PATH" };
  }

  try {
    const staticBin = require("ffmpeg-static");
    if (staticBin && existsSync(staticBin)) {
      return { bin: staticBin, source: "ffmpeg-static" };
    }
  } catch {
    /* optional dependency */
  }

  return null;
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function convertOne(ffmpegBin, baseName, ext, ffmpegArgs) {
  const input = join(AUDIO_DIR, `${baseName}.wav`);
  const output = join(AUDIO_DIR, `${baseName}.${ext}`);

  if (!existsSync(input)) {
    console.warn(
      `  ⚠ Skip ${baseName}.${ext}: ${baseName}.wav not found (run npm run generate:audio first)`,
    );
    return { ok: false, skipped: true, outSize: 0 };
  }

  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input,
    ...ffmpegArgs,
    output,
  ];
  const result = spawnSync(ffmpegBin, args, { encoding: "utf8" });

  if (result.status !== 0) {
    console.error(`  ✗ ${baseName}.${ext} failed`);
    if (result.stderr) console.error(result.stderr.trim());
    return { ok: false, skipped: false, outSize: 0 };
  }

  if (!existsSync(output)) {
    console.error(`  ✗ ${baseName}.${ext} was not created`);
    return { ok: false, skipped: false, outSize: 0 };
  }

  const inSize = statSync(input).size;
  const outSize = statSync(output).size;
  const ratio = ((1 - outSize / inSize) * 100).toFixed(0);
  console.log(
    `  ✓ ${baseName}.${ext}  ${formatMb(outSize)}  (was ${formatMb(inSize)}, −${ratio}%)`,
  );
  return { ok: true, skipped: false, outSize };
}

function main() {
  console.log("Optimizing ambient audio for web (WAV → OGG + MP3)…\n");

  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn(`
⚠ ffmpeg not found — OGG/MP3 files were not created.

Install one of:
  • System ffmpeg: https://ffmpeg.org/download.html
    Windows: winget install Gyan.FFmpeg
  • npm dev dependency: npm install --save-dev ffmpeg-static

Then run: npm run optimize:audio

The game still works with .wav fallback until compressed files exist.
`);
    process.exit(0);
  }

  console.log(`Using ffmpeg (${ffmpeg.source}): ${ffmpeg.bin}\n`);

  if (!existsSync(AUDIO_DIR)) {
    console.warn(`⚠ ${AUDIO_DIR} does not exist. Run npm run generate:audio first.`);
    process.exit(0);
  }

  let totalOut = 0;
  let converted = 0;
  let failed = 0;

  for (const base of TRACKS) {
    for (const job of [
      { ext: "ogg", args: OGG_ARGS },
      { ext: "mp3", args: MP3_ARGS },
    ]) {
      const res = convertOne(ffmpeg.bin, base, job.ext, job.args);
      if (res.ok) {
        converted += 1;
        totalOut += res.outSize;
      } else if (!res.skipped) {
        failed += 1;
      }
    }
  }

  console.log("");
  if (converted > 0) {
    console.log(`Done: ${converted} file(s), total ${formatMb(totalOut)}`);
    const ogg = readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".ogg"));
    const mp3 = readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
    console.log(`OGG: ${ogg.join(", ")}`);
    console.log(`MP3: ${mp3.join(", ")}`);
  }
  if (failed > 0) {
    console.warn(`${failed} conversion(s) failed.`);
    process.exit(1);
  }
  process.exit(0);
}

main();
