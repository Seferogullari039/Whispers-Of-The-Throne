import type { ActNumber } from "@/lib/acts";
import {
  getGameSettings,
  getMusicVolumeSetting,
  setAudioEnabledSetting,
  setMusicEnabledSetting,
} from "@/lib/gameSettings";

/** Web Audio drone kapalı — müzik dosya tabanlı HTMLAudioElement ile çalar. */
export const PROCEDURAL_AMBIENT_ENABLED = false;

const SFX_BUS_GAIN = 0.05;
const MUSIC_FADE_MS = 1400;
const TEST_TONE_RETRY_MS = 360;
const IS_DEV = process.env.NODE_ENV === "development";

function getMusicTargetVolume(): number {
  return getMusicVolumeSetting();
}

const ACT_TRACK_BASES: Record<ActNumber, string> = {
  1: "act-1-ashes",
  2: "act-2-whispers",
  3: "act-3-shadows",
  4: "act-4-seals",
  5: "act-5-throne",
};

const MENU_TRACK_BASE = "menu-theme";
const INTRO_TRACK_BASE = "intro-theme";

/** @deprecated Use ACT_TRACK_BASES — web prefers compressed formats */
const ACT_TRACKS: Record<ActNumber, string> = {
  1: `/audio/${ACT_TRACK_BASES[1]}.wav`,
  2: `/audio/${ACT_TRACK_BASES[2]}.wav`,
  3: `/audio/${ACT_TRACK_BASES[3]}.wav`,
  4: `/audio/${ACT_TRACK_BASES[4]}.wav`,
  5: `/audio/${ACT_TRACK_BASES[5]}.wav`,
};

const MENU_TRACK = `/audio/${MENU_TRACK_BASE}.wav`;

export type MusicContext = { type: "menu" } | { type: "act"; act: ActNumber };

export type GameMusicPhase =
  | "hero"
  | "origin_intro"
  | "playing"
  | "result"
  | "ending";

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
let currentAct: ActNumber | null = null;
let musicUnlockedByUser = false;
let resumeListenerAttached = false;
let pendingStartAfterUnlock: (() => void) | null = null;
let introEl: HTMLAudioElement | null = null;

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
): void {
  clearFadeInterval();
  const steps = 24;
  const stepMs = MUSIC_FADE_MS / steps;
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
    `/audio/${base}.mp3`,
    `/audio/${base}.ogg`,
    `/audio/${base}.wav`,
  ];
}

function trackBaseForContext(context: MusicContext): string {
  return context.type === "menu" ? MENU_TRACK_BASE : ACT_TRACK_BASES[context.act];
}

export function resolveMusicContext(
  phase: GameMusicPhase,
  act: ActNumber,
): MusicContext {
  if (phase === "hero" || phase === "origin_intro") {
    return { type: "menu" };
  }
  if (phase === "ending") {
    return { type: "act", act: 5 };
  }
  return { type: "act", act };
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

function applyMusicVolume(el: HTMLAudioElement, opts: PlayMusicOptions): void {
  el.muted = false;
  const target = getMusicTargetVolume();
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
): Promise<boolean> {
  applyMusicVolume(el, opts);

  if (!el.paused) {
    lastPlayError = null;
    return true;
  }

  try {
    await el.play();
    applyMusicVolume(el, opts);
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
): Promise<boolean> {
  requestedSrc = src;
  applyMusicVolume(el, opts);

  if (srcMatchesLoaded(el, src)) {
    const ok = await ensureMusicPlaying(el, opts);
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

  const ok = await ensureMusicPlaying(el, opts);
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
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;

  const el = getMusicElement();
  const candidates = trackCandidates(base);

  if (!force && currentTrackBase === base) {
    if (isMusicAudible(el)) return;

    if (el.paused && el.src && currentTrackPath) {
      const resumed = await ensureMusicPlaying(el, opts);
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
    currentTrackBase = base;

    const ok = await tryPlaySrc(el, src, opts);
    if (ok) {
      if (!opts.userGesture && el.volume < getMusicTargetVolume() * 0.5) {
        fadeVolume(el, el.volume, getMusicTargetVolume());
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

function getIntroElement(): HTMLAudioElement {
  if (!introEl) {
    introEl = new Audio();
    introEl.loop = false;
    introEl.preload = "auto";
    introEl.volume = getMusicTargetVolume();
    introEl.muted = false;
  }
  return introEl;
}

/** Intro splash — yalnızca müzik açık + unlock varsa çalar */
export function playIntroTheme(): void {
  if (IS_DEV) {
    console.log("[audio] playIntroTheme called", {
      musicEnabled: isMusicEnabled(),
      unlocked: musicUnlockedByUser,
    });
  }
  if (!canUseAudio()) return;
  if (!isMusicEnabled() || !musicUnlockedByUser) return;

  void (async () => {
    await unlockAudio();
    const el = getIntroElement();
    el.muted = false;
    el.volume = getMusicTargetVolume();
    el.loop = false;

    const candidates = trackCandidates(INTRO_TRACK_BASE);
    for (const src of candidates) {
      requestedSrc = src;
      el.src = src;
      el.load();
      try {
        await waitForCanPlay(el, src);
        await el.play();
        lastPlayError = null;
        return;
      } catch (err) {
        logPlayError(err, src);
      }
    }
  })();
}

export function stopIntroTheme(): void {
  if (!introEl) return;
  introEl.pause();
  introEl.currentTime = 0;
}

/** Intro bitti — intro-theme → menu-theme crossfade */
export function crossfadeIntroToMenuMusic(): void {
  if (!canUseAudio()) {
    stopIntroTheme();
    return;
  }

  if (!isMusicEnabled() || !musicUnlockedByUser) {
    stopIntroTheme();
    return;
  }

  void (async () => {
    await unlockAudio();
    const intro = introEl;
    const menu = getMusicElement();
    const target = getMusicTargetVolume();
    const candidates = trackCandidates(MENU_TRACK_BASE);

    menu.loop = true;
    menu.muted = false;
    menu.volume = 0;

    let menuStarted = false;
    for (const src of candidates) {
      requestedSrc = src;
      menu.src = src;
      menu.load();
      try {
        await waitForCanPlay(menu, src);
        await menu.play();
        currentTrackBase = MENU_TRACK_BASE;
        currentTrackPath = src;
        menuStarted = true;
        lastPlayError = null;
        break;
      } catch (err) {
        logPlayError(err, src);
      }
    }

    if (!menuStarted) {
      stopIntroTheme();
      return;
    }

    const steps = 22;
    const stepMs = 55;
    let step = 0;
    const introStartVol = intro?.volume ?? target;

    const crossfadeId = window.setInterval(() => {
      step += 1;
      const t = step / steps;
      if (intro && !intro.paused) {
        intro.volume = Math.max(0, introStartVol * (1 - t));
      }
      menu.volume = target * t;
      if (step >= steps) {
        window.clearInterval(crossfadeId);
        stopIntroTheme();
        menu.volume = target;
      }
    }, stepMs);
  })();
}

/**
 * Ayarlar > Müzik Aç — click handler içinden çağır.
 * `startMusic` aynı handler'da hemen ve test tonu sonrası tekrar çağrılmalı.
 */
export function enableMusicFromUserGesture(startMusic?: () => void): void {
  if (!canUseAudio()) return;
  musicUnlockedByUser = true;
  setMusicEnabledSetting(true);
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

/** Müzik açılış test tonu — Web Audio (SFX ayarından bağımsız) */
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
    musicUnlockedByUser = false;
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
  currentAct = null;
  requestedSrc = null;
}

export async function startMenuMusic(
  force = false,
  opts: PlayMusicOptions = {},
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;
  if (!musicUnlockedByUser && !opts.userGesture) return;
  await unlockAudio();
  currentAct = null;
  await playMusicByBase(MENU_TRACK_BASE, force, opts);
}

export async function startAmbientMusic(
  act: ActNumber,
  force = false,
  opts: PlayMusicOptions = {},
): Promise<void> {
  if (!canUseAudio() || !isMusicEnabled()) return;
  if (!musicUnlockedByUser && !opts.userGesture) return;

  await unlockAudio();

  if (!PROCEDURAL_AMBIENT_ENABLED) {
    currentAct = act;
    await playMusicByBase(ACT_TRACK_BASES[act], force, opts);
  }
}

export async function startGameMusic(
  context: MusicContext,
  force = false,
  opts: PlayMusicOptions = {},
): Promise<void> {
  if (context.type === "menu") {
    await startMenuMusic(force, opts);
    return;
  }
  await startAmbientMusic(context.act, force, opts);
}

/** Phase + act → doğru parça; gereksiz restart yapmaz (crossfade yalnızca track değişince). */
export function startMusicForCurrentPhase(
  phase: GameMusicPhase,
  act: ActNumber,
  opts: PlayMusicOptions = {},
): void {
  if (!canUseAudio() || !isMusicEnabled()) return;
  if (!musicUnlockedByUser && !opts.userGesture) return;
  const context = resolveMusicContext(phase, act);
  void startGameMusic(context, false, opts);
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

export function applyMusicMasterVolume(): void {
  if (!musicEl || musicEl.paused) return;
  musicEl.volume = getMusicTargetVolume();
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
    masterVolume: getMusicTargetVolume(),
    playing: Boolean(el && isMusicAudible(el)),
    unlockedByUser: musicUnlockedByUser,
  };
}

export {
  ACT_TRACK_BASES,
  ACT_TRACKS,
  INTRO_TRACK_BASE,
  MENU_TRACK,
  MENU_TRACK_BASE,
  trackBaseForContext,
  trackCandidates,
};
