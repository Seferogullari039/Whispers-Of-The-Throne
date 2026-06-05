/**
 * Procedural dark-fantasy ambient WAV loops (royalty-free, no external assets).
 * Output: public/audio/*.wav
 *
 * Mix targets: peak 0.65–0.85, audible RMS, energy in 120 Hz–1200 Hz band.
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "audio");
const SAMPLE_RATE = 44100;
const DEFAULT_TARGET_PEAK = 0.75;

/** @param {number} midi */
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** @param {Float32Array} interleaved */
function measureStats(interleaved) {
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < interleaved.length; i++) {
    const s = interleaved[i];
    const a = Math.abs(s);
    if (a > peak) peak = a;
    sumSq += s * s;
  }
  return { peak, rms: Math.sqrt(sumSq / interleaved.length) };
}

/** Gentle saturation — avoids harsh clipping / crackle after normalize */
function softClip(sample) {
  if (Math.abs(sample) <= 0.85) return sample;
  return Math.tanh(sample * 1.05) * 0.88;
}

/**
 * @param {Float32Array} interleaved
 * @param {number} targetPeak
 */
function normalize(interleaved, targetPeak = DEFAULT_TARGET_PEAK) {
  let { peak } = measureStats(interleaved);
  if (peak <= 0) return measureStats(interleaved);

  let gain = targetPeak / peak;
  for (let i = 0; i < interleaved.length; i++) {
    interleaved[i] = softClip(interleaved[i] * gain);
  }

  ({ peak } = measureStats(interleaved));
  if (peak > 0 && peak < targetPeak * 0.98) {
    gain = targetPeak / peak;
    for (let i = 0; i < interleaved.length; i++) {
      interleaved[i] = softClip(interleaved[i] * gain);
    }
  }

  return measureStats(interleaved);
}

/**
 * @param {Float32Array} interleaved
 * @param {number} sampleRate
 * @param {number} channels
 */
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

  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const clamped = Math.max(-1, Math.min(1, interleaved[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * @typedef {{ midi: number, amp: number, detune?: number, wave?: "sine"|"tri"|"pad"|"choir"|"bell" }} Tone
 * @typedef {{ name: string, duration: number, tones: Tone[], noise?: number, lfoRate?: number, pulseRate?: number, targetPeak?: number, subMidi?: number, subAmp?: number }} LoopSpec
 */

/** Warm string/pad: tri + 2nd harmonic */
function padSample(phase, amp) {
  const tri = (2 / Math.PI) * Math.asin(Math.sin(phase));
  const h2 = Math.sin(phase * 2) * 0.22;
  return amp * (tri * 0.78 + h2);
}

/** Detuned choir stack (mid-range body) */
function choirSample(phase, amp, t, midi) {
  const spread = [0, 0.06, -0.05, 0.11, -0.09];
  let sum = 0;
  for (let v = 0; v < spread.length; v++) {
    const f = midiToFreq(midi + spread[v]);
    sum += Math.sin(2 * Math.PI * f * t + v * 0.7);
  }
  return (amp / spread.length) * sum;
}

/** Shimmer bell / chime partial with slow AM */
function bellSample(phase, amp, t, midi) {
  const shimmer = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.13 * t + midi * 0.2);
  const body = Math.sin(phase) * 0.65 + Math.sin(phase * 2.01) * 0.2;
  return amp * body * shimmer;
}

function toneSample(tone, t) {
  const base = midiToFreq(tone.midi + (tone.detune ?? 0));
  const phase = 2 * Math.PI * base * t;
  const wave = tone.wave ?? "sine";

  switch (wave) {
    case "tri":
      return tone.amp * (2 / Math.PI) * Math.asin(Math.sin(phase));
    case "pad":
      return padSample(phase, tone.amp);
    case "choir":
      return choirSample(phase, tone.amp, t, tone.midi + (tone.detune ?? 0));
    case "bell":
      return bellSample(phase, tone.amp, t, tone.midi);
    default:
      return tone.amp * Math.sin(phase);
  }
}

/** @param {LoopSpec} spec */
function generateLoop(spec) {
  const {
    name,
    duration,
    tones,
    noise = 0,
    lfoRate = 0.04,
    pulseRate = 0,
    targetPeak = DEFAULT_TARGET_PEAK,
    subMidi,
    subAmp = 0.1,
  } = spec;

  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n * 2);
  let noiseState = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let mono = 0;

    if (subMidi !== undefined) {
      const subPhase = 2 * Math.PI * midiToFreq(subMidi) * t;
      mono += subAmp * Math.sin(subPhase);
    }

    for (const tone of tones) {
      const mod =
        1 + 0.004 * Math.sin(2 * Math.PI * lfoRate * t + tone.midi * 0.13);
      const base = midiToFreq(tone.midi + (tone.detune ?? 0));
      const freq = base * mod;
      const phase = 2 * Math.PI * freq * t;
      if (tone.wave === "pad" || tone.wave === "tri") {
        mono += padSample(phase, tone.amp);
      } else if (tone.wave === "choir") {
        mono += choirSample(phase, tone.amp, t, tone.midi + (tone.detune ?? 0));
      } else if (tone.wave === "bell") {
        mono += bellSample(phase, tone.amp, t, tone.midi);
      } else {
        mono += tone.amp * Math.sin(phase);
      }
    }

    if (noise > 0) {
      const raw = Math.random() * 2 - 1;
      noiseState = noiseState * 0.99 + raw * 0.01;
      mono += noiseState * noise;
    }

    if (pulseRate > 0) {
      mono *= 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * pulseRate * t));
    }

    const fadeSec = Math.min(3, duration * 0.06);
    let env = 1;
    if (t < fadeSec) {
      env = 0.5 - 0.5 * Math.cos((Math.PI * t) / fadeSec);
    } else if (t > duration - fadeSec) {
      env = 0.5 - 0.5 * Math.cos((Math.PI * (duration - t)) / fadeSec);
    }

    mono *= env;
    out[i * 2] = mono * 0.94;
    out[i * 2 + 1] = mono * 1.0;
  }

  const stats = normalize(out, targetPeak);
  const wav = encodeWav(out, SAMPLE_RATE, 2);
  const path = join(OUT_DIR, name);
  writeFileSync(path, wav);
  const sizeKb = Math.round(wav.length / 1024);
  console.log(
    `  ✓ ${name} (${duration}s, ${sizeKb} KB) peak=${stats.peak.toFixed(3)} rms=${stats.rms.toFixed(3)}`,
  );
}

/** 5 s audible reference — simple dark-fantasy minor arpeggio + pad */
function generateTestTone() {
  const duration = 5;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n * 2);
  const chord = [57, 60, 64, 67]; // A3, C4, E4, G4 — mid-range, clearly audible

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let mono = 0;

    for (let c = 0; c < chord.length; c++) {
      const freq = midiToFreq(chord[c]);
      const phase = 2 * Math.PI * freq * t;
      const arp = Math.sin(2 * Math.PI * 0.5 * t + c * 1.2);
      const noteEnv = 0.65 + 0.35 * (0.5 + 0.5 * arp);
      mono += padSample(phase, 0.14) * noteEnv;
      mono += Math.sin(phase) * 0.06 * noteEnv;
    }

    mono += choirSample(0, 0.12, t, 48);

    const attack = Math.min(1, t / 0.08);
    const release =
      t > duration - 0.4 ? (duration - t) / 0.4 : 1;
    mono *= attack * release;

    out[i * 2] = mono * 0.94;
    out[i * 2 + 1] = mono;
  }

  const stats = normalize(out, 0.82);
  const wav = encodeWav(out, SAMPLE_RATE, 2);
  const path = join(OUT_DIR, "test-tone.wav");
  writeFileSync(path, wav);
  console.log(
    `  ✓ test-tone.wav (${duration}s) peak=${stats.peak.toFixed(3)} rms=${stats.rms.toFixed(3)}`,
  );
}

/** 6 s cinematic intro — warm royal sting, choir pad, soft bells */
function generateIntroTheme() {
  const duration = 6;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n * 2);

  /** D major spread — warm, regal, not horror-dark */
  const padMidis = [50, 54, 57, 62, 66];
  const bellHits = [
    { t: 0.15, midi: 74, amp: 0.22 },
    { t: 0.55, midi: 78, amp: 0.16 },
    { t: 1.35, midi: 81, amp: 0.12 },
  ];

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let mono = 0;

    const padEnv =
      t < 0.35
        ? (t / 0.35) * (t / 0.35)
        : t > duration - 1.2
          ? ((duration - t) / 1.2) * ((duration - t) / 1.2)
          : 1;

    for (const midi of padMidis) {
      const freq = midiToFreq(midi);
      const phase = 2 * Math.PI * freq * t;
      const swell = 0.55 + 0.45 * Math.min(1, t / 1.8);
      mono += padSample(phase, 0.11 * padEnv * swell);
      mono += choirSample(phase, 0.07 * padEnv * swell, t, midi);
    }

    for (const hit of bellHits) {
      const dt = t - hit.t;
      if (dt >= 0 && dt < 2.5) {
        const bellEnv = Math.exp(-dt * 2.8);
        const freq = midiToFreq(hit.midi);
        const phase = 2 * Math.PI * freq * t;
        mono +=
          Math.sin(phase) * hit.amp * bellEnv +
          Math.sin(phase * 2.01) * hit.amp * 0.28 * bellEnv;
      }
    }

    if (t < 0.45) {
      const sting = Math.sin(2 * Math.PI * midiToFreq(62) * t);
      const stingEnv = Math.exp(-t * 4.5) * Math.min(1, t / 0.06);
      mono += sting * 0.18 * stingEnv;
    }

    const attack = Math.min(1, t / 0.04);
    mono *= attack;

    out[i * 2] = mono * 0.94;
    out[i * 2 + 1] = mono;
  }

  const stats = normalize(out, 0.78);
  const wav = encodeWav(out, SAMPLE_RATE, 2);
  const path = join(OUT_DIR, "intro-theme.wav");
  writeFileSync(path, wav);
  console.log(
    `  ✓ intro-theme.wav (${duration}s, ${Math.round(wav.length / 1024)} KB) peak=${stats.peak.toFixed(3)} rms=${stats.rms.toFixed(3)}`,
  );
}

/** Mid-range layers (≈130 Hz–1 kHz) + subtle sub + bell shimmer */
const MID_PAD = (midi, amp) => ({ midi, amp, wave: "pad" });
const CHOIR = (midi, amp, detune = 0) => ({
  midi,
  amp,
  detune,
  wave: "choir",
});
const BELL = (midi, amp) => ({ midi, amp, wave: "bell" });

/** @type {LoopSpec[]} */
const LOOPS = [
  {
    name: "act-1-ashes.wav",
    duration: 50,
    targetPeak: 0.78,
    lfoRate: 0.035,
    noise: 0.006,
    subMidi: 40,
    subAmp: 0.08,
    tones: [
      MID_PAD(48, 0.2),
      MID_PAD(55, 0.16),
      CHOIR(52, 0.14),
      CHOIR(59, 0.1, 0.05),
      BELL(72, 0.07),
      BELL(79, 0.05),
    ],
  },
  {
    name: "act-2-whispers.wav",
    duration: 52,
    targetPeak: 0.79,
    lfoRate: 0.042,
    noise: 0.005,
    subMidi: 41,
    subAmp: 0.07,
    tones: [
      MID_PAD(50, 0.19),
      MID_PAD(57, 0.15),
      CHOIR(53, 0.13),
      CHOIR(60, 0.11, -0.04),
      BELL(74, 0.08),
      BELL(81, 0.05),
    ],
  },
  {
    name: "act-3-shadows.wav",
    duration: 48,
    targetPeak: 0.78,
    lfoRate: 0.048,
    pulseRate: 0.06,
    noise: 0.005,
    subMidi: 39,
    subAmp: 0.07,
    tones: [
      MID_PAD(49, 0.18),
      MID_PAD(56, 0.16),
      CHOIR(52, 0.12),
      CHOIR(64, 0.1),
      BELL(71, 0.07),
      BELL(77, 0.06),
    ],
  },
  {
    name: "act-4-seals.wav",
    duration: 55,
    targetPeak: 0.8,
    lfoRate: 0.038,
    pulseRate: 0.045,
    subMidi: 42,
    subAmp: 0.08,
    tones: [
      MID_PAD(51, 0.2),
      MID_PAD(58, 0.15),
      CHOIR(55, 0.14),
      CHOIR(62, 0.1, 0.06),
      BELL(75, 0.08),
      BELL(82, 0.05),
    ],
  },
  {
    name: "act-5-throne.wav",
    duration: 58,
    targetPeak: 0.81,
    lfoRate: 0.03,
    pulseRate: 0.035,
    subMidi: 38,
    subAmp: 0.09,
    tones: [
      MID_PAD(47, 0.19),
      MID_PAD(54, 0.17),
      MID_PAD(61, 0.13),
      CHOIR(58, 0.12),
      CHOIR(65, 0.09),
      BELL(73, 0.08),
      BELL(79, 0.06),
    ],
  },
  {
    name: "menu-theme.wav",
    duration: 60,
    targetPeak: 0.77,
    lfoRate: 0.028,
    pulseRate: 0.028,
    subMidi: 40,
    subAmp: 0.07,
    tones: [
      MID_PAD(50, 0.18),
      MID_PAD(57, 0.15),
      CHOIR(53, 0.13),
      CHOIR(60, 0.1),
      BELL(72, 0.07),
      BELL(78, 0.06),
    ],
  },
];

mkdirSync(OUT_DIR, { recursive: true });

console.log("Generating procedural ambient WAV loops…");
console.log(`Output: ${OUT_DIR}`);
console.log(`Target peak: 0.65–0.85\n`);

for (const loop of LOOPS) {
  generateLoop(loop);
}

console.log("\nGenerating test reference tone…");
generateTestTone();

console.log("\nGenerating intro theme sting…");
generateIntroTheme();

console.log(`\nDone — ${LOOPS.length + 2} files.`);
