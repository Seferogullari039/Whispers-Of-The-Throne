export type GameSettings = {
  audioEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
};

const KEYS = {
  audioEnabled: "audioEnabled",
  musicEnabled: "musicEnabled",
  vibrationEnabled: "vibrationEnabled",
} as const;

const LEGACY_AUDIO_KEY = "wot-audio-enabled";

const DEFAULTS: GameSettings = {
  audioEnabled: false,
  musicEnabled: false,
  vibrationEnabled: true,
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
  return {
    audioEnabled: readBool(KEYS.audioEnabled, DEFAULTS.audioEnabled),
    musicEnabled: readBool(KEYS.musicEnabled, DEFAULTS.musicEnabled),
    vibrationEnabled: readBool(
      KEYS.vibrationEnabled,
      DEFAULTS.vibrationEnabled,
    ),
  };
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
