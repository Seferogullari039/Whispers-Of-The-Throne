"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO_THRONE_ROOM_URL } from "@/lib/heroAssets";

const STUDIO_MS = 1500;
const LOGO_MS = 2000;
const FADE_TO_HERO_MS = 800;
const IS_DEV = process.env.NODE_ENV === "development";

const INTRO_CINEMATIC_CLASS =
  "intro-cinematic fixed inset-0 z-[200] overflow-hidden";

type IntroPhase = "studio" | "logo" | "exit";

type IntroSplashProps = {
  onComplete: () => void;
};

function LogoParticles() {
  return (
    <div
      className="intro-logo-particles pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="intro-particle"
          style={
            {
              "--p-left": `${10 + ((i * 19) % 80)}%`,
              "--p-delay": `${(i * 0.4) % 2.5}s`,
              "--p-dur": `${3.2 + (i % 3) * 0.5}s`,
              "--p-size": `${1.5 + (i % 2)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const [phase, setPhase] = useState<IntroPhase>("studio");
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    setPhase("exit");
    schedule(() => {
      if (IS_DEV) console.log("[intro] Intro complete");
      onComplete();
    }, FADE_TO_HERO_MS);
  }, [clearTimers, onComplete, schedule]);

  useEffect(() => {
    if (IS_DEV) console.log("[intro] Intro mounted");

    const img = new Image();
    img.src = HERO_THRONE_ROOM_URL;

    schedule(() => setPhase("logo"), STUDIO_MS);
    schedule(finish, STUDIO_MS + LOGO_MS);

    return () => {
      clearTimers();
    };
  }, [clearTimers, finish, schedule]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const showLogoLayers = phase === "logo" || phase === "exit";

  return (
    <div
      className={INTRO_CINEMATIC_CLASS}
      data-phase={phase}
      role="presentation"
      onPointerDown={finish}
      tabIndex={-1}
      aria-label="Giriş — geçmek için dokunun veya ESC"
    >
      <div className="intro-bg-base absolute inset-0" aria-hidden />

      {showLogoLayers && (
        <>
          <div className="intro-bg-beam absolute inset-0" aria-hidden />
          <div className="intro-bg-throne-silhouette absolute inset-0" aria-hidden />
          <LogoParticles />
        </>
      )}

      {phase === "studio" && (
        <div className="intro-studio intro-studio-in relative z-10 flex h-full flex-col items-center justify-center">
          <p className="intro-studio-label font-heading text-[10px] font-semibold uppercase tracking-[0.55em] text-amber-400/90">
            Studio
          </p>
          <p className="intro-studio-name font-heading mt-2 text-sm font-bold uppercase tracking-[0.38em] text-amber-200/95 sm:text-base">
            Alper Bostancı
          </p>
        </div>
      )}

      {showLogoLayers && (
        <div className="intro-logo relative z-10 flex h-full flex-col items-center justify-center px-6">
          <div className="intro-logo-content flex w-full max-w-[min(94vw,26rem)] flex-col items-center text-center">
            <h1 className="intro-logo-title intro-logo-title-in font-heading font-black uppercase text-amber-50">
              Whispers of the Throne
            </h1>
            <p className="intro-logo-slogan intro-logo-slogan-in font-heading mt-4 font-semibold uppercase text-amber-300/88">
              Hükmet ya da yok ol
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
