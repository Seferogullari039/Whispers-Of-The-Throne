/**
 * Measure peak/RMS of audio files (WAV/MP3/OGG) via ffmpeg decode.
 * Usage: node scripts/measure-audio-peaks.mjs [file...]
 */

import { spawnSync } from "child_process";
import { createRequire } from "module";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

function findFfmpeg() {
  try {
    const staticBin = require("ffmpeg-static");
    if (staticBin && existsSync(staticBin)) return staticBin;
  } catch {
    /* optional */
  }
  return "ffmpeg";
}

function measureWavInt16(filePath) {
  const buf = readFileSync(filePath);
  if (buf.length < 44) return null;
  let peak = 0;
  let sumSq = 0;
  let n = 0;
  for (let i = 44; i + 3 < buf.length; i += 4) {
    const l = buf.readInt16LE(i) / 32767;
    const r = buf.readInt16LE(i + 2) / 32767;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    sumSq += l * l + r * r;
    n += 2;
  }
  return { peak, rms: Math.sqrt(sumSq / n) };
}

function measureViaFfmpeg(ffmpegBin, filePath) {
  const result = spawnSync(
    ffmpegBin,
    [
      "-hide_banner",
      "-i",
      filePath,
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const text = `${result.stderr ?? ""}${result.stdout ?? ""}`;
  const peak = text.match(/max_volume:\s*([-\d.]+)\s*dB/i);
  const rms = text.match(/mean_volume:\s*([-\d.]+)\s*dB/i);
  if (!peak) return null;
  const peakLin = Math.pow(10, parseFloat(peak[1]) / 20);
  const rmsLin = rms ? Math.pow(10, parseFloat(rms[1]) / 20) : 0;
  return { peak: peakLin, rms: rmsLin };
}

const ffmpegBin = findFfmpeg();
const defaults = [
  "test-tone.wav",
  "test-tone.mp3",
  "menu-theme.wav",
  "menu-theme.mp3",
  "act-1-ashes.wav",
  "act-1-ashes.mp3",
];
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : defaults;

console.log("Audio peak / RMS measurement\n");
for (const name of files) {
  const path = name.includes("/") || name.includes("\\") ? name : join(AUDIO_DIR, name);
  if (!existsSync(path)) {
    console.log(`  ✗ ${name} — not found`);
    continue;
  }
  const stats =
    name.endsWith(".wav")
      ? measureWavInt16(path)
      : measureViaFfmpeg(ffmpegBin, path);
  if (!stats) {
    console.log(`  ✗ ${name} — decode failed`);
    continue;
  }
  console.log(
    `  ${name.padEnd(22)} peak=${stats.peak.toFixed(3)} rms=${stats.rms.toFixed(3)}`,
  );
}
