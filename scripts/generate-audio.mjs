/**
 * Loop-safe ambient generation — deploy prep.
 * 8 s equal-power crossfade head/tail, boundary repair, loop metrics.
 */

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "audio");
const SAMPLE_RATE = 44100;
const TARGET_PEAK = 0.63;
const LOOP_REGION_SEC = 8;
const SOFT_ENTRY_SEC = 2;
const DC_SMOOTH_SEC = 0.5;

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function seededNoise(t, seed) {
  const x = Math.sin(t * 12_345.678 + seed * 0.017) * 43_758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function measureStats(buf) {
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    if (a > peak) peak = a;
    sumSq += buf[i] * buf[i];
  }
  return { peak, rms: Math.sqrt(sumSq / buf.length) };
}

function computeLoopMetrics(mono) {
  const n = mono.length;
  const startEndDelta = Math.abs(mono[0] - mono[n - 1]);
  let maxSampleJump = Math.abs(mono[0] - mono[n - 1]);
  for (let i = 1; i < n; i++) {
    maxSampleJump = Math.max(maxSampleJump, Math.abs(mono[i] - mono[i - 1]));
  }
  return { startEndDelta, maxSampleJump, ...measureStats(mono) };
}

function softClip(s) {
  if (Math.abs(s) <= 0.9) return s;
  return Math.tanh(s) * 0.88;
}

function normalize(mono, target = TARGET_PEAK) {
  let { peak } = measureStats(mono);
  if (peak <= 0) return measureStats(mono);
  let g = target / peak;
  for (let i = 0; i < mono.length; i++) mono[i] = softClip(mono[i] * g);
  ({ peak } = measureStats(mono));
  if (peak > 0 && peak < target * 0.97) {
    g = target / peak;
    for (let i = 0; i < mono.length; i++) mono[i] = softClip(mono[i] * g);
  }
  return measureStats(mono);
}

function encodeWav(interleaved, sampleRate, channels) {
  const numSamples = interleaved.length / channels;
  const dataSize = numSamples * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  let o = 44;
  for (let i = 0; i < interleaved.length; i++) {
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, interleaved[i])) * 32767),
      o,
    );
    o += 2;
  }
  return buffer;
}

function toStereo(mono) {
  const out = new Float32Array(mono.length * 2);
  for (let i = 0; i < mono.length; i++) {
    out[i * 2] = mono[i] * 0.94;
    out[i * 2 + 1] = mono[i];
  }
  return out;
}

/**
 * Equal-power crossfade: last 8 s ↔ first 8 s, then head = blended tail.
 */
function applyLoopCrossfade(mono, fadeSec = LOOP_REGION_SEC) {
  const fade = Math.floor(fadeSec * SAMPLE_RATE);
  const n = mono.length;
  if (fade * 2 >= n) return;

  const head = new Float32Array(fade);
  for (let i = 0; i < fade; i++) head[i] = mono[i];

  for (let i = 0; i < fade; i++) {
    const gOut = Math.cos((i / fade) * (Math.PI / 2));
    const gIn = Math.sin((i / fade) * (Math.PI / 2));
    mono[n - fade + i] = mono[n - fade + i] * gOut + head[i] * gIn;
  }

  for (let i = 0; i < fade; i++) {
    mono[i] = mono[n - fade + i];
  }
}

/** Pull last 500 ms toward start level; lock wrap sample. */
function repairLoopBoundary(mono) {
  const n = mono.length;
  const smoothLen = Math.floor(DC_SMOOTH_SEC * SAMPLE_RATE);
  const target = mono[0];

  if (Math.abs(mono[n - 1] - target) > 0.0003) {
    for (let i = 0; i < smoothLen; i++) {
      const idx = n - smoothLen + i;
      const w = (i + 1) / smoothLen;
      mono[idx] = mono[idx] * (1 - w * 0.85) + target * (w * 0.85);
    }
  }

  mono[n - 1] = mono[0];

  if (Math.abs(mono[0]) < 0.0015 && Math.abs(mono[n - 1]) < 0.0015) {
    mono[0] = 0;
    mono[n - 1] = 0;
  }
}

/** Gentle entry — only first 2 s, matched at loop wrap after crossfade. */
function applySoftEntry(mono) {
  const entry = Math.floor(SOFT_ENTRY_SEC * SAMPLE_RATE);
  const n = mono.length;
  for (let i = 0; i < entry && i < n; i++) {
    const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / entry);
    const soft = 0.72 + 0.28 * g;
    mono[i] *= soft;
  }
  mono[n - 1] = mono[0];
}

function finalizeLoopBuffer(mono) {
  applyLoopCrossfade(mono, LOOP_REGION_SEC);
  repairLoopBoundary(mono);
  repairLoopBoundary(mono);
}

function padTone(freq, t, amp) {
  const p = 2 * Math.PI * freq * t;
  const tri = (2 / Math.PI) * Math.asin(Math.sin(p));
  return amp * (tri * 0.5 + Math.sin(p) * 0.35 + Math.sin(p * 2) * 0.08);
}

function pluck(freq, t, start, decay = 0.65) {
  const dt = t - start;
  if (dt < 0 || dt > decay) return 0;
  const env = Math.exp(-dt * 4.2) * (1 - Math.exp(-dt * 28));
  const p = 2 * Math.PI * freq * dt;
  return env * (Math.sin(p) * 0.65 + Math.sin(p * 2.01) * 0.2);
}

function bell(freq, t, start, amp = 0.08) {
  const dt = t - start;
  if (dt < 0 || dt > 2.2) return 0;
  const env = Math.exp(-dt * 2.4);
  const p = 2 * Math.PI * freq * dt;
  return amp * env * (Math.sin(p) * 0.6 + Math.sin(p * 2.4) * 0.15);
}

function softShaker(t, start, seed, amp = 0.014) {
  const dt = t - start;
  if (dt < 0 || dt > 0.08) return 0;
  return amp * Math.exp(-dt * 40) * seededNoise(t * 97.3, seed);
}

function lightTap(t, bpm, amp = 0.009) {
  const beat = 60 / bpm;
  const pos = t % beat;
  if (pos < 0.05) return amp * 0.5 * (1 - Math.cos((Math.PI * pos) / 0.05));
  return 0;
}

function harpPhrase(midiNotes, t, phraseStart, amp = 0.09) {
  let sum = 0;
  for (let i = 0; i < midiNotes.length; i++) {
    const noteStart = phraseStart + i * 0.22;
    sum += pluck(midiToFreq(midiNotes[i]), t, noteStart, 0.42) * amp;
  }
  return sum;
}

function buildVariationEvents(duration, seed, density = 1, themeMidis = []) {
  const rng = makeRng(seed);
  const events = [];
  const margin = LOOP_REGION_SEC + 2;
  let t = margin + rng() * 4;
  let themeIdx = 0;
  while (t < duration - margin) {
    const roll = rng();
    if (roll < 0.28 * density) {
      events.push({ t, type: "bell", midi: 72 + Math.floor(rng() * 10) });
    } else if (roll < 0.58 * density) {
      events.push({ t, type: "pluck", midi: 60 + Math.floor(rng() * 14) });
    } else if (roll < 0.72 * density) {
      events.push({ t, type: "shaker" });
    } else if (roll < 0.88 * density) {
      events.push({ t, type: "string", midi: 55 + Math.floor(rng() * 10) });
    } else if (themeMidis.length) {
      events.push({
        t,
        type: "theme",
        midi: themeMidis[themeIdx % themeMidis.length],
        phrase: themeMidis.slice(themeIdx % themeMidis.length, themeIdx % themeMidis.length + 4),
      });
      themeIdx++;
    } else {
      events.push({ t, type: "tap" });
    }
    t += 12 + rng() * 4;
  }
  return events;
}

/** Periodic phase — loopPeriod = duration − 8 s overlap window. */
function sampleAt(t, duration, cfg, events, seed) {
  const {
    chords,
    bpm = 68,
    padAmp = 0.058,
    pluckAmp = 0.145,
    arpRate = 0.62,
    subAmp = 0,
    rhythm = true,
    themePhrase,
  } = cfg;

  const loopPeriod = duration - LOOP_REGION_SEC;
  const pt = ((t % loopPeriod) + loopPeriod) % loopPeriod;

  const barDur = (60 / bpm) * 4;
  const chordIdx = Math.floor(pt / (barDur * 2)) % chords.length;
  const chord = chords[chordIdx];
  let mono = 0;

  for (const m of chord) {
    mono += padTone(midiToFreq(m), pt, padAmp * 0.35);
    const swell = 0.94 + 0.06 * Math.sin(2 * Math.PI * pt / 28 + m * 0.1);
    mono += Math.sin(2 * Math.PI * midiToFreq(m) * pt) * padAmp * 0.12 * swell;
    mono +=
      Math.sin(2 * Math.PI * midiToFreq(m + 12) * pt) * padAmp * 0.14 * swell;
  }

  if (subAmp > 0) {
    mono += Math.sin(2 * Math.PI * midiToFreq(chord[0] - 12) * pt) * subAmp;
  }

  const arpStep = Math.floor(pt * arpRate);
  const note = chord[arpStep % chord.length] + 12;
  const arpStart = arpStep / arpRate;
  mono += pluck(midiToFreq(note), pt, arpStart, 0.48) * pluckAmp;

  if (rhythm) {
    mono += lightTap(pt, bpm);
    if (Math.floor(pt / barDur) % 2 === 1) {
      mono += lightTap(pt + barDur * 0.5, bpm, 0.007);
    }
  }

  if (themePhrase?.length) {
    const phraseLen = themePhrase.length * 0.22 + 0.5;
    const phrasePeriod = 16 + (themePhrase.length % 3);
    const phraseIdx = Math.floor(pt / phrasePeriod);
    const phraseStart = (phraseIdx * phrasePeriod) % loopPeriod;
    if (pt >= phraseStart && pt < phraseStart + phraseLen) {
      const phraseEnv = Math.min(1, (pt - phraseStart) / 0.08, (phraseStart + phraseLen - pt) / 0.12);
      mono += harpPhrase(themePhrase, pt, phraseStart, pluckAmp * 0.72 * phraseEnv);
    }
  }

  for (const ev of events) {
    if (ev.t < LOOP_REGION_SEC || ev.t > duration - LOOP_REGION_SEC) continue;
    const evPt = ev.t % loopPeriod;
    if (ev.type === "bell") mono += bell(midiToFreq(ev.midi), pt, evPt, 0.09);
    if (ev.type === "pluck")
      mono += pluck(midiToFreq(ev.midi), pt, evPt, 0.48) * 0.11;
    if (ev.type === "shaker") mono += softShaker(pt, evPt, seed);
    if (ev.type === "tap") mono += lightTap(pt, evPt, 0.009);
    if (ev.type === "string") {
      mono +=
        padTone(midiToFreq(ev.midi), pt, 0.028) *
        Math.exp(-Math.max(0, pt - evPt) * 0.85);
    }
    if (ev.type === "theme" && ev.phrase?.length) {
      mono += harpPhrase(ev.phrase, pt, evPt, 0.08);
    }
  }

  const breathe = 0.96 + 0.04 * Math.sin(2 * Math.PI * pt / 37);
  return mono * breathe;
}

function synthesizeLoop(name, duration, cfg) {
  const n = Math.floor(duration * SAMPLE_RATE);
  const mono = new Float32Array(n);
  const seed = hashSeed(name);
  const events = buildVariationEvents(
    duration,
    seed,
    cfg.density ?? 1,
    cfg.themePhrase ?? [],
  );

  for (let i = 0; i < n; i++) {
    mono[i] = sampleAt(i / SAMPLE_RATE, duration, cfg, events, seed);
  }

  finalizeLoopBuffer(mono);
  const metrics = computeLoopMetrics(mono);
  normalize(mono, TARGET_PEAK);
  const after = computeLoopMetrics(mono);

  const wav = encodeWav(toStereo(mono), SAMPLE_RATE, 2);
  writeFileSync(join(OUT_DIR, name), wav);
  return {
    stats: after,
    duration,
    bytes: wav.length,
    startEndDelta: after.startEndDelta,
    maxSampleJump: after.maxSampleJump,
  };
}

function synthesizeEnding(name, duration, cfg) {
  const n = Math.floor(duration * SAMPLE_RATE);
  const mono = new Float32Array(n);
  const { chords, mood = "neutral", bpm = 64, themePhrase = [] } = cfg;
  const seed = hashSeed(name);
  const events = buildVariationEvents(duration * 0.7, seed, 0.75, themePhrase);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let monoS = 0;
    const chord = chords[Math.floor(t / 13) % chords.length];
    for (const m of chord) {
      monoS += padTone(midiToFreq(m), t, 0.045);
    }
    const arpStep = Math.floor(t * 0.5);
    const arpNote = chord[arpStep % chord.length] + 12;
    monoS += pluck(midiToFreq(arpNote), t, arpStep / 0.5, 0.5) * 0.1;
    monoS += lightTap(t, bpm, mood === "bad" ? 0.014 : 0.008);

    for (const ev of events) {
      if (ev.t < duration - 6) {
        if (ev.type === "bell")
          monoS += bell(midiToFreq(ev.midi + 5), t, ev.t, 0.075);
        if (ev.type === "pluck")
          monoS += pluck(midiToFreq(ev.midi), t, ev.t, 0.48) * 0.09;
        if (ev.type === "theme" && ev.phrase?.length)
          monoS += harpPhrase(ev.phrase, t, ev.t, 0.11);
      }
    }
    if (mood === "true" && t > duration * 0.38) {
      monoS += bell(midiToFreq(84), t, duration * 0.38, 0.09);
      monoS += harpPhrase([76, 79, 83, 88], t, duration * 0.38, 0.08);
    }
    if (mood === "bad" && t > duration * 0.55) {
      monoS += pluck(midiToFreq(50), t, duration * 0.55, 0.7) * 0.12;
    }

    let env = 1;
    if (t < SOFT_ENTRY_SEC) {
      env = 0.5 - 0.5 * Math.cos((Math.PI * t) / SOFT_ENTRY_SEC);
    }
    if (t > duration - 3) {
      env *= 0.5 - 0.5 * Math.cos((Math.PI * (duration - t)) / 3);
    }
    mono[i] = monoS * env;
  }

  const metrics = computeLoopMetrics(mono);
  normalize(mono, TARGET_PEAK);
  const after = computeLoopMetrics(mono);

  const wav = encodeWav(toStereo(mono), SAMPLE_RATE, 2);
  writeFileSync(join(OUT_DIR, name), wav);
  return {
    stats: after,
    duration,
    bytes: wav.length,
    startEndDelta: after.startEndDelta,
    maxSampleJump: after.maxSampleJump,
  };
}

function analyzeAudio(name, result) {
  const { stats, duration, bytes, startEndDelta, maxSampleJump } = result;
  const ok =
    stats.peak <= TARGET_PEAK + 0.02 &&
    startEndDelta < 0.008 &&
    maxSampleJump < 0.12;
  console.log(
    `  ${ok ? "✓" : "⚠"} ${name}  ${duration}s  peak=${stats.peak.toFixed(3)}  rms=${stats.rms.toFixed(3)}  Δ=${startEndDelta.toFixed(5)}  jump=${maxSampleJump.toFixed(5)}`,
  );
  return {
    name,
    duration,
    peak: stats.peak,
    rms: stats.rms,
    bytes,
    startEndDelta,
    maxSampleJump,
  };
}

/** Pass #6 — Reigns-like court intrigue: lute, harp, bell, light percussion. */
const AMBIENT_LOOPS = [
  {
    file: "menu-theme.wav",
    duration: 84,
    cfg: {
      bpm: 76,
      density: 1.1,
      padAmp: 0.048,
      pluckAmp: 0.14,
      arpRate: 0.58,
      themePhrase: [62, 65, 69, 72],
      chords: [
        [50, 53, 57],
        [52, 55, 59],
        [53, 57, 60],
        [50, 54, 57],
      ],
    },
  },
  {
    file: "origin-theme.wav",
    duration: 78,
    cfg: {
      bpm: 72,
      density: 1,
      padAmp: 0.042,
      pluckAmp: 0.13,
      arpRate: 0.54,
      themePhrase: [57, 60, 64, 67],
      chords: [
        [55, 59, 62],
        [53, 57, 60],
        [57, 60, 64],
        [52, 55, 59],
      ],
    },
  },
  {
    file: "journey-early.wav",
    duration: 80,
    cfg: {
      bpm: 74,
      density: 0.88,
      padAmp: 0.038,
      pluckAmp: 0.12,
      arpRate: 0.6,
      themePhrase: [48, 51, 55, 58],
      chords: [
        [48, 51, 55],
        [50, 53, 57],
        [47, 50, 54],
        [49, 52, 55],
      ],
    },
  },
  {
    file: "journey-streets.wav",
    duration: 82,
    cfg: {
      bpm: 70,
      density: 1.05,
      padAmp: 0.04,
      pluckAmp: 0.13,
      arpRate: 0.64,
      themePhrase: [55, 58, 62, 65],
      chords: [
        [49, 52, 56],
        [51, 54, 58],
        [48, 52, 55],
        [50, 53, 57],
      ],
    },
  },
  {
    file: "journey-trade.wav",
    duration: 84,
    cfg: {
      bpm: 80,
      density: 1.08,
      padAmp: 0.044,
      pluckAmp: 0.14,
      arpRate: 0.66,
      themePhrase: [58, 62, 65, 69],
      chords: [
        [51, 55, 58],
        [53, 57, 60],
        [52, 55, 59],
        [50, 54, 57],
      ],
    },
  },
  {
    file: "journey-court.wav",
    duration: 86,
    cfg: {
      bpm: 68,
      density: 1,
      padAmp: 0.046,
      pluckAmp: 0.135,
      arpRate: 0.56,
      themePhrase: [61, 64, 68, 71],
      chords: [
        [54, 58, 61],
        [52, 55, 59],
        [55, 59, 62],
        [53, 57, 60],
      ],
    },
  },
  {
    file: "journey-throne.wav",
    duration: 90,
    cfg: {
      bpm: 66,
      density: 1.05,
      padAmp: 0.05,
      pluckAmp: 0.14,
      arpRate: 0.52,
      themePhrase: [59, 63, 66, 71],
      chords: [
        [55, 59, 62],
        [57, 61, 64],
        [54, 58, 61],
        [56, 60, 63],
      ],
    },
  },
];

const ENDINGS = [
  {
    file: "ending-bad.wav",
    duration: 48,
    mood: "bad",
    bpm: 58,
    themePhrase: [50, 53, 55, 48],
    chords: [
      [48, 51, 55],
      [46, 49, 53],
      [45, 48, 52],
    ],
  },
  {
    file: "ending-neutral.wav",
    duration: 52,
    mood: "neutral",
    bpm: 62,
    themePhrase: [55, 58, 62, 55],
    chords: [
      [52, 55, 59],
      [50, 53, 57],
      [48, 52, 55],
    ],
  },
  {
    file: "ending-good.wav",
    duration: 52,
    mood: "good",
    bpm: 68,
    themePhrase: [62, 65, 69, 74],
    chords: [
      [55, 59, 62],
      [57, 60, 64],
      [59, 62, 66],
    ],
  },
  {
    file: "ending-true.wav",
    duration: 56,
    mood: "true",
    bpm: 72,
    themePhrase: [64, 68, 71, 76],
    chords: [
      [57, 61, 64],
      [59, 62, 66],
      [60, 64, 67],
      [62, 66, 69],
    ],
  },
];

const DEPRECATED_PREFIXES = ["level-", "intro-theme", "ending-theme", "act-"];

mkdirSync(OUT_DIR, { recursive: true });

console.log("Loop-safe audio generation (8 s crossfade, boundary repair)\n");

const report = [];

for (const track of AMBIENT_LOOPS) {
  report.push(
    analyzeAudio(track.file, synthesizeLoop(track.file, track.duration, track.cfg)),
  );
}

console.log("\nEnding themes…");
for (const e of ENDINGS) {
  report.push(
    analyzeAudio(
      e.file,
      synthesizeEnding(e.file, e.duration, {
        chords: e.chords,
        mood: e.mood,
        bpm: e.bpm,
        themePhrase: e.themePhrase,
      }),
    ),
  );
}

console.log("\nCleaning deprecated audio…");
for (const f of readdirSync(OUT_DIR)) {
  const base = f.replace(/\.(wav|mp3|ogg)$/, "");
  if (DEPRECATED_PREFIXES.some((p) => base.startsWith(p) || base === p)) {
    try {
      unlinkSync(join(OUT_DIR, f));
      console.log(`  − ${f}`);
    } catch {
      /* skip */
    }
  }
}

console.log("\n── Analysis summary ──");
console.log(
  "Track".padEnd(26),
  "Dur".padStart(5),
  "Peak".padStart(6),
  "RMS".padStart(6),
  "ΔSE".padStart(8),
  "Jump".padStart(8),
);
for (const r of report) {
  console.log(
    r.name.padEnd(26),
    `${r.duration}s`.padStart(5),
    r.peak.toFixed(3).padStart(6),
    r.rms.toFixed(3).padStart(6),
    r.startEndDelta.toFixed(5).padStart(8),
    r.maxSampleJump.toFixed(5).padStart(8),
  );
}

console.log(`\nDone — ${report.length} tracks regenerated.`);
