"use client";

import { useEffect, useState } from "react";
import { HERO_THRONE_ROOM_URL } from "@/lib/heroAssets";
import { APP_VERSION_FULL } from "@/lib/version";

const IS_DEV = process.env.NODE_ENV === "development";

type HeroScreenProps = {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue?: () => void;
  onOpenSettings: () => void;
};

function HeroMenuLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hero-menu-link font-heading min-h-[44px] px-3 py-2 text-[11px] font-semibold uppercase text-amber-200/78 transition duration-300 active:scale-105 hover:scale-105"
    >
      {label}
    </button>
  );
}

export function HeroScreen({
  hasSave,
  onNewGame,
  onContinue,
  onOpenSettings,
}: HeroScreenProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (IS_DEV) console.log("[intro] Hero mounted");
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onerror = () => setImageFailed(true);
    img.src = HERO_THRONE_ROOM_URL;
  }, []);

  return (
    <section className="hero-screen hero-enter-from-intro flex h-full min-h-dvh w-full flex-1 flex-col">
      <div
        className="hero-bg-image"
        style={{ backgroundImage: `url("${HERO_THRONE_ROOM_URL}")` }}
        aria-hidden
      />
      {imageFailed && (
        <div className="hero-bg-fallback absolute inset-0 z-0" aria-hidden />
      )}

      <div className="hero-bg-vignette pointer-events-none absolute inset-0 z-[1]" />
      <div className="hero-bg-glow pointer-events-none absolute inset-0 z-[1]" />

      <div className="hero-content flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-center">
        <div className="hero-title-block w-full max-w-[min(92vw,22rem)]">
          <h1 className="hero-title font-heading font-black uppercase text-amber-50">
            Whispers of the Throne
          </h1>
          <p className="hero-slogan font-heading mt-1.5 font-semibold uppercase text-amber-300/92">
            Hükmet ya da yok ol
          </p>
        </div>

        <nav
          className="hero-actions hero-menu-rise mt-5 flex shrink-0 flex-col items-center gap-0.5"
          aria-label="Ana menü"
        >
          <HeroMenuLink label="Yeni Oyun" onClick={onNewGame} />
          {hasSave && onContinue && (
            <HeroMenuLink label="Devam Et" onClick={onContinue} />
          )}
          <HeroMenuLink label="Ayarlar" onClick={onOpenSettings} />
        </nav>

        <p className="hero-version-badge pointer-events-none mt-6 text-[9px] font-medium tracking-[0.14em] text-amber-500/45">
          {APP_VERSION_FULL}
        </p>
      </div>
    </section>
  );
}
