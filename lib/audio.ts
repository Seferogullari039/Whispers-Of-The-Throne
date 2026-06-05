import {
  getGameSettings,
  getMusicVolumeSetting,
  setAudioEnabledSetting,
  setMusicEnabledSetting,
} from "@/lib/gameSettings";
import {
  getMusicTrackForLevel,
  type GameMusicPhase,
} from "@/lib/musicTracks";

/** Web Audio drone kapalı — müzik dosya tabanlı HTMLAudioElement ile çalar. */
export const PROCEDURAL_AMBIENT_ENABLED = false;

const SFX_BUS_GAIN = 0.05;
const MUSIC_CROSSFADE_MS = 1750;
const PLAYBACK_ENTRY_FADE_MS = 3000;
const TEST_TONE_RETRY_MS = 360;
const IS_DEV = process.env.NODE_ENV === "development";

/** Absolute gain targets (before user preference scaling). */
const PHASE_GAIN: Record<GameMusicPhase, number> = {
  hero: 0.5,
  origin_intro: 0.48,
  playing: 0.45,
  result: 0.45,
  ending: 0.55,
};

const DEFAULT_USER_MUSIC = 0.55;

let currentMusicPhase: GameMusicPhase = "hero";

function getMusicTargetVolume(phase: GameMusicPhase = currentMusicPhase): number {
  const user = getMusicVolumeSetting();
  const scale = user / DEFAULT_USER_MUSIC;
  return Math.min(0.6, PHASE_GAIN[phase] * scale);
}

type PlayMusicOptions = {
  /** İlk başlatma kullanıcı tıklamasından — autoplay unlock */
  userGesture?: boolean;
};

let audioCtx: AudioContext | null = null;
let musicEl: HTMLAudioElement | null = null;
let currentTrackBase: string | null = null;
let currentTrackPath: string | null = null;
let requestedSrc: string | null = null;
let lastPlayError: string | null = null;
let fadeIntervalId: ReturnType<typeof setInterval> | null = null;
let musicUnlockedByUser = false;
let resumeListenerAttached = false;
let pendingStartAfterUnlock: (() => void) | null = null;
const unlockListeners = new Set<() => void>();

function notifyMusicUnlockListeners(): void {
  for (const fn of unlockListeners) fn();
}

export function subscribeMusicUnlock(listener: () => void): () => void {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
}

function canUseAudio(): boolean {
  return typeof window !== "undefined";
}

function logPlayError(reason: unknown, src: string): void {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : String(reason);
  lastPlayError = `${message} (${src})`;
  if (IS_DEV) {
    console.warn(`[audio] Audio play failed: ${lastPlayError}`);
  }
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

function clearFadeInterval(): void {
  if (fadeIntervalId !== null) {
    clearInterval(fadeIntervalId);
    fadeIntervalId = null;
  }
}

function attachResumeOnInteraction(): void {
  if (!canUseAudio() || resumeListenerAttached) return;
  resumeListenerAttached = true;

  const onInteraction = () => {
    if (!isMusicEnabled() || !musicUnlockedByUser) return;
    void resumePausedMusicIfNeeded({ userGesture: true });
  };

  window.addEventListener("pointerdown", onInteraction, { passive: true });
  window.addEventListener("keydown", onInteraction, { passive: true });
}

function getMusicElement(): HTMLAudioElement {
  if (!musicEl) {
    musicEl = new Audio();
    musicEl.loop = true;
    musicEl.preload = "auto";
    musicEl.volume = getMusicTargetVolume();
    musicEl.muted = false;
    musicEl.addEventListener("error", () => {
      if (IS_DEV && musicEl?.error) {
        lastPlayError = `Media error code ${musicEl.error.code} (${requestedSrc ?? "?"})`;
        console.warn(`[audio] ${lastPlayError}`);
      }
    });
  }
  return musicEl;
}

function fadeVolume(
  el: HTMLAudioElement,
  from: number,
  to: number,
  onDone?: () => void,
  durationMs = MUSIC_CROSSFADE_MS,
): void {
  clearFadeInterval();
  const steps = 28;
  const stepMs = durationMs / steps;
  let step = 0;
  fadeIntervalId = setInterval(() => {
    step += 1;
    const t = step / steps;
    el.volume = from + (to - from) * t;
    if (step >= steps) {
      clearFadeInterval();
      el.volume = to;
      onDone?.();
    }
  }, stepMs);
}

function trackCandidates(base: string): string[] {
  return [
    `/audio/${base}.ogg`,
    `/audio/${base}.mp3`,
    `/audio/${base}.wav`,
  ];
}

function srcMatchesLoaded(el: HTMLAudioElement, src: string): boolean {
  if (currentTrackPath === src) return true;
  try {
    const abs = new URL(src, window.location.origin).href;
    return el.src === abs || el.currentSrc === abs;
  } catch {
    return el.src.endsWith(src);
  }
}

function isMusicAudible(el: HTMLAudioElement): boolean {
  return !el.paused && el.volume > 0.01 && !el.muted;
}

function applyMusicVolume(
  el: HTMLAudioElement,
  opts: PlayMusicOptions,
  phase: GameMusicPhase = currentMusicPhase,
): void {
  el.muted = false;
  const target = getMusicTargetVolume(phase);
  if (opts.userGesture || el.volume < 0.01) {
    el.volume = target;
  }
}

async function waitForCanPlay(el: HTMLAudioElement, src: string): Promise<void> {
  if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Load timeout for ${src}`));
    }, 8000);

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`Media error loading ${src}`));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onErr);
    };

    el.addEventListener("canplay", onReady, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

async function ensureMusicPlaying(
  el: HTMLAudioElement,
  opts: PlayMusicOptions,
  phase: GameMusicPhase = currentMusicPhase,
): Promise<boolean> {
  applyMusicVolume(el, opts, phase);

  if (!el.paused) {
    lastPlayError = null;
    return true;
  }

  try {
    await el.play();
    applyMusicVolume(el, opts, phase);
    lastPlayError = null;
    return true;
  } catch (err) {
    logPlayError(err, el.src || requestedSrc || "?");
    return false;
  }
}

async function tryPlaySrc(
  el: HTMLAudioElement,
  src: string,
  opts: PlayMusicOptions,
  phase: GameMusicPhase = currentMusicPhase,
): Promise<boolean> {
  requestedSrc = src;
  applyMusicVolume(el, opts, phase);

  if (srcMatchesLoaded(el, src)) {
    const ok = await ensureMusicPlaying(el, opts, phase);
    if (ok) {
      currentTrackPath = src;
      return true;
    }
  }

  el.src = src;
  el.load();

  try {
    await waitForCanPlay(el, src);
  } catch (err) {
    logPlayError(err, src);
    return false;
  }

  const ok = await ensureMusicPlaying(el, opts, phase);
  if (ok) {
    currentTrackPath = src;
    return true;
  }
  return false;
}

async function playMusicByBase(
  base: string,
  force: boolean,
  opts: PlayMusicOptions = {},
  phase: GameMusicPhase = currentMusicPhase,
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;

  const el = getMusicElement();
  const candidates = trackCandidates(base);

  if (!force && currentTrackBase === base) {
    if (isMusicAudible(el)) return;

    if (el.paused && el.src && currentTrackPath) {
      const resumed = await ensureMusicPlaying(el, opts, phase);
      if (resumed) return;
    }
  }

  const startCandidate = async (index: number): Promise<void> => {
    if (index >= candidates.length) {
      currentTrackBase = null;
      currentTrackPath = null;
      return;
    }

    const src = candidates[index]!;
    const prevBase = currentTrackBase;
    currentTrackBase = base;

    const ok = await tryPlaySrc(el, src, opts, phase);
    if (ok) {
      const target = getMusicTargetVolume(phase);
      if (force || prevBase !== base) {
        el.volume = 0;
        fadeVolume(el, 0, target, undefined, PLAYBACK_ENTRY_FADE_MS);
      } else if (el.volume < target * 0.5) {
        fadeVolume(el, el.volume, target);
      }
      return;
    }

    await startCandidate(index + 1);
  };

  const sameTrackPlaying =
    currentTrackBase === base && isMusicAudible(el) && !force;

  if (sameTrackPlaying) return;

  if (
    currentTrackBase &&
    currentTrackBase !== base &&
    isMusicAudible(el)
  ) {
    fadeVolume(el, el.volume, 0, () => {
      el.pause();
      void startCandidate(0);
    });
  } else {
    await startCandidate(0);
  }
}

export function isMusicUnlockedByUser(): boolean {
  return musicUnlockedByUser;
}

export function needsMusicUnlockPrompt(): boolean {
  return false;
}

/** İlk kullanıcı etkileşiminde müziği sessizce unlock et (buton yok). */
export function unlockMusicOnFirstInteraction(startMusic: () => void): () => void {
  if (!canUseAudio() || !isMusicEnabled() || musicUnlockedByUser) {
    return () => {};
  }

  const handler = () => {
    if (!isMusicEnabled() || musicUnlockedByUser) return;
    enableMusicFromUserGesture(startMusic);
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("keydown", handler, true);
  };

  window.addEventListener("pointerdown", handler, { capture: true, passive: true });
  window.addEventListener("keydown", handler, { capture: true, passive: true });

  return () => {
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("keydown", handler, true);
  };
}

/**
 * Ayarlar > Müzik Aç veya hero "Müziği Başlat" — click handler içinden çağır.
 */
export function enableMusicFromUserGesture(startMusic?: () => void): void {
  if (!canUseAudio()) return;
  musicUnlockedByUser = true;
  setMusicEnabledSetting(true);
  notifyMusicUnlockListeners();
  attachResumeOnInteraction();
  void unlockAudio();
  playMusicTestTone();

  pendingStartAfterUnlock = startMusic ?? null;

  startMusic?.();

  window.setTimeout(() => {
    pendingStartAfterUnlock?.();
    void resumePausedMusicIfNeeded({ userGesture: true });
    pendingStartAfterUnlock = null;
  }, TEST_TONE_RETRY_MS);
}

export async function resumePausedMusicIfNeeded(
  opts: PlayMusicOptions = {},
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled() || !musicUnlockedByUser) return;

  const el = musicEl;
  if (!el?.src) return;
  if (!el.paused) return;

  applyMusicVolume(el, opts);
  await ensureMusicPlaying(el, opts);
}

/** Sessiz autoplay dene — başarılı olursa unlock sayılır. */
export async function attemptAutoplayForPhase(
  phase: GameMusicPhase,
  playerLevel: number,
): Promise<boolean> {
  if (!canUseAudio() || !isMusicEnabled() || musicUnlockedByUser) {
    return musicUnlockedByUser;
  }

  await unlockAudio();
  const base = getMusicTrackForLevel(playerLevel, phase);
  const el = getMusicElement();
  const candidates = trackCandidates(base);

  for (const src of candidates) {
    el.src = src;
    el.load();
    try {
      await waitForCanPlay(el, src);
      applyMusicVolume(el, { userGesture: false });
      await el.play();
      musicUnlockedByUser = true;
      currentTrackBase = base;
      currentTrackPath = src;
      lastPlayError = null;
      notifyMusicUnlockListeners();
      return true;
    } catch (err) {
      logPlayError(err, src);
    }
  }

  return false;
}

export function playMusicTestTone(): void {
  void (async () => {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const bus = ctx.createGain();
    bus.gain.value = 0.2;
    bus.connect(ctx.destination);

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(392, time);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.35, time + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(g);
    g.connect(bus);
    osc.start(time);
    osc.stop(time + 0.3);

    window.setTimeout(() => bus.disconnect(), 400);
  })();
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
  attachResumeOnInteraction();
}

export function stopAmbientMusic(): void {
  clearFadeInterval();
  if (musicEl) {
    const el = musicEl;
    if (el.volume > 0.01 && !el.paused) {
      fadeVolume(el, el.volume, 0, () => {
        el.pause();
        el.currentTime = 0;
      });
    } else {
      el.pause();
      el.volume = 0;
    }
  }
  currentTrackPath = null;
  currentTrackBase = null;
  requestedSrc = null;
}

export async function startMusicForPhase(
  phase: GameMusicPhase,
  playerLevel: number,
  force = false,
  opts: PlayMusicOptions = {},
  endingType?: import("@/lib/musicTracks").EndingType,
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;
  if (!musicUnlockedByUser && !opts.userGesture) return;

  await unlockAudio();
  currentMusicPhase = phase;
  const base = getMusicTrackForLevel(playerLevel, phase, endingType);
  await playMusicByBase(base, force, opts, phase);
}

/** Phase + level → doğru parça; crossfade yalnızca track değişince. */
export function startMusicForCurrentPhase(
  phase: GameMusicPhase,
  playerLevel: number,
  opts: PlayMusicOptions = {},
  endingType?: import("@/lib/musicTracks").EndingType,
): void {
  if (!canUseAudio() || !isMusicEnabled()) return;
  if (!musicUnlockedByUser && !opts.userGesture) return;
  void startMusicForPhase(phase, playerLevel, false, opts, endingType);
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

export function applyMusicMasterVolume(): void {
  if (!musicEl || musicEl.paused) return;
  musicEl.volume = getMusicTargetVolume(currentMusicPhase);
}

const READY_STATE_LABELS = [
  "HAVE_NOTHING",
  "HAVE_METADATA",
  "HAVE_CURRENT_DATA",
  "HAVE_FUTURE_DATA",
  "HAVE_ENOUGH_DATA",
] as const;

export type MusicDebugState = {
  currentTrack: string | null;
  trackFile: string | null;
  trackBase: string | null;
  requestedSrc: string | null;
  readyState: number;
  readyStateLabel: string;
  paused: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  lastPlayError: string | null;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  playing: boolean;
  unlockedByUser: boolean;
};

export function getMusicDebugState(): MusicDebugState {
  const el = musicEl;
  const trackFile = currentTrackPath
    ? currentTrackPath.split("/").pop() ?? null
    : null;
  const rs = el?.readyState ?? 0;
  return {
    currentTrack: trackFile,
    trackFile,
    trackBase: currentTrackBase,
    requestedSrc,
    readyState: rs,
    readyStateLabel: READY_STATE_LABELS[rs] ?? `unknown(${rs})`,
    paused: el?.paused ?? true,
    currentTime: el?.currentTime ?? 0,
    volume: el?.volume ?? 0,
    muted: el?.muted ?? false,
    lastPlayError,
    musicEnabled: isMusicEnabled(),
    sfxEnabled: isAudioEnabled(),
    masterVolume: getMusicTargetVolume(currentMusicPhase),
    playing: Boolean(el && isMusicAudible(el)),
    unlockedByUser: musicUnlockedByUser,
  };
}

export type { GameMusicPhase };
export {
  getMusicTrackForLevel,
  trackCandidates,
};
