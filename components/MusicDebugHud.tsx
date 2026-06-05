"use client";

import { useEffect, useState } from "react";
import { getMusicDebugState } from "@/lib/audio";

const IS_DEV = process.env.NODE_ENV === "development";

export function MusicDebugHud() {
  const [state, setState] = useState(getMusicDebugState);

  useEffect(() => {
    if (!IS_DEV) return;
    const tick = () => setState(getMusicDebugState());
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, []);

  if (!IS_DEV) return null;

  const musicLabel = state.musicEnabled ? "on" : "off";
  const sfxLabel = state.sfxEnabled ? "on" : "off";

  return (
    <div
      className="game-fixed-overlay pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 z-[48] max-w-[min(92vw,20rem)] rounded-md border border-violet-900/40 bg-black/80 px-2 py-1.5 font-mono text-[8px] leading-snug text-violet-200/85 backdrop-blur-sm"
      aria-hidden
    >
      <p>
        currentTrack:{" "}
        <span className="text-amber-200/90">{state.currentTrack ?? "—"}</span>
      </p>
      <p>
        requestedSrc:{" "}
        <span className="text-amber-100/75">{state.requestedSrc ?? "—"}</span>
      </p>
      <p>
        readyState: {state.readyState} ({state.readyStateLabel}) · paused:{" "}
        {String(state.paused)} · time: {state.currentTime.toFixed(2)} · vol:{" "}
        {state.volume.toFixed(2)} · muted: {String(state.muted)}
      </p>
      <p>
        Müzik: {musicLabel} · SFX: {sfxLabel} · unlock:{" "}
        {state.unlockedByUser ? "yes" : "no"} · target:{" "}
        {state.masterVolume.toFixed(2)}
      </p>
      {state.lastPlayError ? (
        <p className="text-rose-300/90">lastPlayError: {state.lastPlayError}</p>
      ) : null}
    </div>
  );
}
