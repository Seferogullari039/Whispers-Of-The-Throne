export type GameSettings = {
  audioEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  /** 0–1 master music gain (Settings slider hook) */
  musicVolume: number;
};

/** Default user music preference (phase multipliers applied in audio.ts) */
export const MUSIC_MASTER_VOLUME = 0.55;
export const DEFAULT_MUSIC_VOLUME = MUSIC_MASTER_VOLUME;

const KEYS = {
  audioEnabled: "audioEnabled",
  musicEnabled: "musicEnabled",
  vibrationEnabled: "vibrationEnabled",
  musicVolume: "musicVolume",
} as const;

const LEGACY_AUDIO_KEY = "wot-audio-enabled";

const DEFAULTS: GameSettings = {
  audioEnabled: false,
  musicEnabled: true,
  vibrationEnabled: true,
  musicVolume: DEFAULT_MUSIC_VOLUME,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readBool(key: string, fallback: boolean): boolean {
  if (!canUseStorage()) return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

function writeBool(key: string, value: boolean): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, value ? "true" : "false");
}

function readFloat(key: string, fallback: number): number {
  if (!canUseStorage()) return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function writeFloat(key: string, value: number): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, String(value));
}

function migrateLegacyAudio(): void {
  if (!canUseStorage()) return;
  if (localStorage.getItem(KEYS.audioEnabled) !== null) return;
  const legacy = localStorage.getItem(LEGACY_AUDIO_KEY);
  if (legacy === null) return;
  const enabled = legacy === "true";
  writeBool(KEYS.audioEnabled, enabled);
  writeBool(KEYS.musicEnabled, enabled);
}

export function getGameSettings(): GameSettings {
  migrateLegacyAudio();
  const musicVolume = clampVolume(
    readFloat(KEYS.musicVolume, DEFAULTS.musicVolume),
  );
  return {
    audioEnabled: readBool(KEYS.audioEnabled, DEFAULTS.audioEnabled),
    musicEnabled: readBool(KEYS.musicEnabled, DEFAULTS.musicEnabled),
    vibrationEnabled: readBool(
      KEYS.vibrationEnabled,
      DEFAULTS.vibrationEnabled,
    ),
    musicVolume,
  };
}

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function getMusicVolumeSetting(): number {
  return getGameSettings().musicVolume;
}

/** Settings > Müzik sesi slider (0–1) — ileride UI bağlanacak */
export function setMusicVolumeSetting(volume: number): void {
  writeFloat(KEYS.musicVolume, clampVolume(volume));
}

export function setAudioEnabledSetting(enabled: boolean): void {
  writeBool(KEYS.audioEnabled, enabled);
}

export function setMusicEnabledSetting(enabled: boolean): void {
  writeBool(KEYS.musicEnabled, enabled);
}

export function setVibrationEnabledSetting(enabled: boolean): void {
  writeBool(KEYS.vibrationEnabled, enabled);
}

export function isVibrationEnabled(): boolean {
  return getGameSettings().vibrationEnabled;
}
