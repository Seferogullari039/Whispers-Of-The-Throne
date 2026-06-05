"use client";

import { useCallback, useEffect, useState } from "react";
import {
  enableMusicFromUserGesture,
  playAudioUnlockChime,
  setAudioEnabled,
  setMusicEnabled,
  stopAmbientMusic,
  unlockAudio,
} from "@/lib/audio";
import {
  getGameSettings,
  setAudioEnabledSetting,
  setMusicEnabledSetting,
  setVibrationEnabledSetting,
} from "@/lib/gameSettings";
import { ALPHA_LABEL } from "@/lib/version";

type SettingsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartMusicForPhase?: () => void;
  onClearSave: () => void;
  onReturnToMainMenu: () => void;
  showGearButton?: boolean;
};

function SettingsMenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsGearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="settings-menu-btn pointer-events-auto relative flex shrink-0 items-center justify-center rounded-md border border-amber-700/20 bg-black/15 text-amber-200/35 backdrop-blur-sm transition active:scale-[0.96] hover:border-amber-600/30 hover:bg-black/25 hover:text-amber-200/55"
      aria-label="Ayarlar"
    >
      <SettingsMenuIcon />
    </button>
  );
}

function SettingToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-amber-100/88">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`settings-toggle-pill min-h-[32px] min-w-[88px] rounded-full border px-3 text-xs font-semibold tracking-wide transition active:scale-[0.97] ${
          enabled
            ? "border-amber-500/55 bg-amber-600/25 text-amber-100"
            : "border-amber-800/45 bg-black/35 text-amber-300/55"
        }`}
      >
        {enabled ? "Açık" : "Kapalı"}
      </button>
    </div>
  );
}

function SettingsActionButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "primary";
}) {
  const styles =
    variant === "danger"
      ? "border-rose-900/50 bg-rose-950/35 text-rose-200/90 hover:bg-rose-950/55"
      : variant === "primary"
        ? "border-amber-500/50 bg-amber-600/20 text-amber-50 hover:bg-amber-600/30"
        : "border-amber-800/45 bg-amber-950/30 text-amber-100/85 hover:bg-amber-900/40";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[42px] w-full rounded-xl border px-4 text-sm font-medium transition active:scale-[0.98] ${styles}`}
    >
      {label}
    </button>
  );
}

export function SettingsMenu({
  open,
  onOpenChange,
  onStartMusicForPhase,
  onClearSave,
  onReturnToMainMenu,
  showGearButton = true,
}: SettingsMenuProps) {
  const [hydrated, setHydrated] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [vibrationOn, setVibrationOn] = useState(true);

  useEffect(() => {
    const s = getGameSettings();
    setAudioOn(s.audioEnabled);
    setMusicOn(s.musicEnabled);
    setVibrationOn(s.vibrationEnabled);
    setHydrated(true);
  }, [open]);

  const toggleAudio = useCallback(async () => {
    const next = !audioOn;
    if (next) {
      await unlockAudio();
      await playAudioUnlockChime();
    }
    setAudioEnabled(next);
    setAudioEnabledSetting(next);
    setAudioOn(next);
  }, [audioOn]);

  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    if (next) {
      setMusicOn(true);
      enableMusicFromUserGesture(() => {
        onStartMusicForPhase?.();
      });
      return;
    }
    setMusicEnabled(false);
    setMusicOn(false);
    stopAmbientMusic();
  }, [musicOn, onStartMusicForPhase]);

  const toggleVibration = useCallback(() => {
    const next = !vibrationOn;
    setVibrationEnabledSetting(next);
    setVibrationOn(next);
  }, [vibrationOn]);

  if (!hydrated) return null;

  return (
    <>
      {showGearButton && (
        <SettingsGearButton onClick={() => onOpenChange(true)} />
      )}

      {open && (
        <div
          className="settings-overlay fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="presentation"
          onClick={() => onOpenChange(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="settings-modal w-[80%] max-w-[320px] rounded-2xl border border-amber-700/45 bg-gradient-to-b from-amber-950/95 to-black/95 p-4 shadow-[0_12px_48px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="settings-title"
              className="font-heading text-center text-lg font-semibold tracking-wide text-amber-50"
            >
              Ayarlar
            </h2>

            <div className="mt-3 divide-y divide-amber-900/35 border-y border-amber-900/30">
              <SettingToggleRow
                label="Ses Efektleri"
                enabled={audioOn}
                onToggle={() => void toggleAudio()}
              />
              <SettingToggleRow
                label="Müzik"
                enabled={musicOn}
                onToggle={toggleMusic}
              />
              <SettingToggleRow
                label="Titreşim"
                enabled={vibrationOn}
                onToggle={toggleVibration}
              />
            </div>

            <div className="mt-3 space-y-2">
              <SettingsActionButton
                label="Kaydı Sil"
                variant="danger"
                onClick={() => {
                  onClearSave();
                  onOpenChange(false);
                }}
              />
              <SettingsActionButton
                label="Ana Menüye Dön"
                onClick={() => {
                  onReturnToMainMenu();
                  onOpenChange(false);
                }}
              />
              <SettingsActionButton
                label="Oyuna Devam Et"
                variant="primary"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <div className="mt-4 space-y-1.5 border-t border-amber-900/25 pt-3">
              <p className="text-center text-[10px] font-medium tracking-[0.22em] text-amber-500/55">
                {ALPHA_LABEL}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-500/40">
                Yakında
              </p>
              {["Dil", "Bildirimler", "Grafik Kalitesi"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-amber-900/20 bg-black/20 px-3 py-2 opacity-40"
                >
                  <span className="text-xs text-amber-200/60">{item}</span>
                  <span className="text-[10px] text-amber-500/45">Kapalı</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
