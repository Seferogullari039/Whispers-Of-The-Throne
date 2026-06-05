"use client";

import { CardArtScene } from "@/components/CardArtScene";

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
      className="hero-menu-link font-heading min-h-[44px] px-2 py-2 text-[11px] font-semibold uppercase text-amber-200/78 transition duration-300 active:scale-105 hover:scale-105"
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
  return (
    <section className="hero-screen relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CardArtScene
          imageKey="throne-room"
          act={[5]}
          sceneKey="ending-vizier"
          aspectClass="h-full min-h-full w-full"
          className="rounded-none border-0"
        />
        <div className="hero-bg-vignette pointer-events-none absolute inset-0 z-[4]" />
        <div className="hero-bg-glow pointer-events-none absolute inset-0 z-[4]" />
      </div>

      <div className="hero-fade-in relative z-10 flex min-h-[70dvh] flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4 pt-[max(2.5rem,env(safe-area-inset-top))] text-center">
          <div className="hero-title-block w-full max-w-[min(100%,26rem)] px-1">
            <h1 className="hero-title font-heading font-black uppercase text-amber-50">
              Whispers of the Throne
            </h1>
            <p className="hero-slogan font-heading mt-2 font-bold uppercase text-amber-300/92">
              Hükmet ya da yok ol
            </p>
          </div>
        </div>

        <nav
          className="hero-actions flex shrink-0 flex-col items-center gap-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
          aria-label="Ana menü"
        >
          <HeroMenuLink label="Yeni Oyun" onClick={onNewGame} />
          {hasSave && onContinue && (
            <HeroMenuLink label="Devam Et" onClick={onContinue} />
          )}
          <HeroMenuLink label="Ayarlar" onClick={onOpenSettings} />
        </nav>
      </div>
    </section>
  );
}
