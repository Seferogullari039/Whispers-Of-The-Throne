/**
 * WAV → OGG (Vorbis) + MP3 for web delivery.
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
  "menu-theme",
  "origin-theme",
  "journey-early",
  "journey-streets",
  "journey-trade",
  "journey-court",
  "journey-throne",
  "ending-bad",
  "ending-neutral",
  "ending-good",
  "ending-true",
];

const OGG_ARGS = ["-c:a", "libvorbis", "-q:a", "3", "-ar", "44100", "-ac", "2"];
const MP3_ARGS = ["-c:a", "libmp3lame", "-b:a", "112k", "-ar", "44100", "-ac", "2"];

function findFfmpeg() {
  const pathCheck = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (pathCheck.status === 0) return { bin: "ffmpeg", source: "PATH" };
  try {
    const staticBin = require("ffmpeg-static");
    if (staticBin && existsSync(staticBin)) {
      return { bin: staticBin, source: "ffmpeg-static" };
    }
  } catch {
    /* optional */
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
    console.warn(`  ⚠ Skip ${baseName}.${ext}: WAV missing`);
    return { ok: false, skipped: true, outSize: 0 };
  }

  const result = spawnSync(
    ffmpegBin,
    ["-y", "-hide_banner", "-loglevel", "error", "-i", input, ...ffmpegArgs, output],
    { encoding: "utf8" },
  );

  if (result.status !== 0 || !existsSync(output)) {
    console.error(`  ✗ ${baseName}.${ext} failed`);
    return { ok: false, skipped: false, outSize: 0 };
  }

  const outSize = statSync(output).size;
  console.log(`  ✓ ${baseName}.${ext}  ${formatMb(outSize)}`);
  return { ok: true, skipped: false, outSize };
}

function main() {
  console.log("Optimizing Pass #5 audio (WAV → OGG + MP3)…\n");

  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn("⚠ ffmpeg not found.");
    process.exit(0);
  }

  console.log(`Using ffmpeg (${ffmpeg.source})\n`);

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
      } else if (!res.skipped) failed += 1;
    }
  }

  console.log("");
  if (converted > 0) {
    console.log(`Done: ${converted} file(s), total ${formatMb(totalOut)}`);
    const ogg = readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".ogg"));
    const mp3 = readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
    console.log(`OGG: ${ogg.length}, MP3: ${mp3.length}`);
    if (totalOut < 12 * 1024 * 1024) {
      console.log(`ℹ Total ${formatMb(totalOut)} (target 12–18 MB)`);
    } else if (totalOut > 18 * 1024 * 1024) {
      console.warn(`⚠ Total ${formatMb(totalOut)} exceeds 18 MB target`);
    } else {
      console.log(`✓ Total ${formatMb(totalOut)} within 12–18 MB target`);
    }
  }
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main();
