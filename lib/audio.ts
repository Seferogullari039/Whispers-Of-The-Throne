import type { ActNumber } from "@/lib/acts";
import { getGameSettings, setAudioEnabledSetting, setMusicEnabledSetting } from "@/lib/gameSettings";

/**
 * Web Audio drone geçici olarak kapalı (cızırtı / düşük kalite).
 * Sonraki aşamada telifsiz lisanslı müzik dosyaları eklenecek.
 */
export const PROCEDURAL_AMBIENT_ENABLED = false;

const AMBIENT_MASTER_GAIN = 0.3;
const AMBIENT_FADE_IN_SEC = 1;
const AMBIENT_FADE_OUT_SEC = 0.35;

const SFX_BUS_GAIN = 0.05;

let audioCtx: AudioContext | null = null;
let ambientMaster: GainNode | null = null;
let currentAct: ActNumber | null = null;

function canUseAudio(): boolean {
  return typeof window !== "undefined";
}

function getContextClass(): typeof AudioContext | null {
  if (!canUseAudio()) return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

export async function resumeAudioContext(): Promise<AudioContext | null> {
  return ensureAudioContext();
}

async function ensureAudioContext(): Promise<AudioContext | null> {
  const Ctx = getContextClass();
  if (!Ctx) return null;

  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctx();
    ambientMaster = audioCtx.createGain();
    ambientMaster.gain.value = 0;
    ambientMaster.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended" || audioCtx.state === "interrupted") {
    try {
      await audioCtx.resume();
    } catch {
      return null;
    }
  }

  return audioCtx;
}

function rampAmbientMaster(
  ctx: AudioContext,
  target: number,
  durationSec: number,
): void {
  if (!ambientMaster) return;
  const t = ctx.currentTime;
  ambientMaster.gain.cancelScheduledValues(t);
  ambientMaster.gain.setValueAtTime(ambientMaster.gain.value, t);
  ambientMaster.gain.linearRampToValueAtTime(target, t + durationSec);
}

export function isAudioEnabled(): boolean {
  if (!canUseAudio()) return false;
  return getGameSettings().audioEnabled;
}

export function isMusicEnabled(): boolean {
  if (!canUseAudio()) return false;
  return getGameSettings().musicEnabled;
}

export function setAudioEnabled(enabled: boolean): void {
  if (!canUseAudio()) return;
  setAudioEnabledSetting(enabled);
}

export function setMusicEnabled(enabled: boolean): void {
  if (!canUseAudio()) return;
  setMusicEnabledSetting(enabled);
  if (!enabled) {
    stopAmbientMusic();
  }
}

export async function unlockAudio(): Promise<void> {
  if (!canUseAudio()) return;
  await ensureAudioContext();
}

/** Ses açılışında kısa onay tonu (ambient kapalıyken de çalar) */
export async function playAudioUnlockChime(): Promise<void> {
  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const bus = ctx.createGain();
  bus.gain.value = 0.12;
  bus.connect(ctx.destination);

  const time = ctx.currentTime;
  const notes = [165, 196];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const start = time + i * 0.09;
    g.gain.setValueAtTime(0.001, start);
    g.gain.linearRampToValueAtTime(0.3, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc.connect(g);
    g.connect(bus);
    osc.start(start);
    osc.stop(start + 0.38);
  });

  window.setTimeout(() => bus.disconnect(), 500);
}

export function initAudio(): void {
  if (!canUseAudio()) return;
}

export function stopAmbientMusic(): void {
  if (ambientMaster && audioCtx) {
    rampAmbientMaster(audioCtx, 0, AMBIENT_FADE_OUT_SEC);
  }
  currentAct = null;
}

export async function startAmbientMusic(
  act: ActNumber,
  force = false,
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;

  await ensureAudioContext();

  if (!PROCEDURAL_AMBIENT_ENABLED) {
    currentAct = act;
    return;
  }

  void act;
  void force;
}

/** @deprecated */
export function playActMusic(act: ActNumber): void {
  void startAmbientMusic(act);
}

/** @deprecated */
export function stopActMusic(): void {
  stopAmbientMusic();
}

async function playOneShot(
  build: (ctx: AudioContext, dest: AudioNode, time: number) => void,
  durationSec = 0.12,
  volume = SFX_BUS_GAIN,
): Promise<void> {
  if (!canUseAudio() || !isAudioEnabled()) return;

  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const bus = ctx.createGain();
  bus.gain.value = volume;
  bus.connect(ctx.destination);

  const time = ctx.currentTime;
  build(ctx, bus, time);

  window.setTimeout(() => {
    bus.disconnect();
  }, durationSec * 1000 + 50);
}

export function playSwipeConfirmSound(): void {
  void playOneShot((ctx, dest, time) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(260, time + 0.06);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.18, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.11);
  }, 0.12, SFX_BUS_GAIN);
}

export function playSwipeSound(): void {
  playSwipeConfirmSound();
}

export function playResultSound(): void {
  void playOneShot((ctx, dest, time) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.connect(dest);

    [0, 4, 7].forEach((semi, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 120 * Math.pow(2, semi / 12);
      const start = time + i * 0.03;
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.1, start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(g);
      g.connect(filter);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  }, 0.4, SFX_BUS_GAIN * 0.9);
}

export function playEndingSound(): void {
  void playOneShot((ctx, dest, time) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(82, time);
    osc.frequency.linearRampToValueAtTime(55, time + 0.65);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.14, time + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.72);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.75);
  }, 0.8, SFX_BUS_GAIN);
}
