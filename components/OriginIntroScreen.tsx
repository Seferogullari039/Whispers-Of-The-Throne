import { CardArtScene } from "@/components/CardArtScene";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import { getOriginScene } from "@/lib/originScene";
import type { Origin } from "@/types/game";

type OriginIntroScreenProps = {
  origin: Origin;
  onBegin: () => void;
};

export function OriginIntroScreen({ origin, onBegin }: OriginIntroScreenProps) {
  const scene = getOriginScene(origin);

  return (
    <section className="game-panel mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-950/60 to-black/70 shadow-lg shadow-black/40">
      <CardArtScene
        imageKey={origin.imageKey}
        act={scene.act}
        sceneKey={scene.sceneKey}
        aspectClass={CARD_PORTRAIT_ART_CLASS}
        className="rounded-none border-0 border-b border-amber-800/40"
      />

      <div className="flex min-h-0 flex-1 flex-col p-3 pt-2.5">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
          Kökenin
        </p>
        <h2 className="mt-0.5 shrink-0 text-xl font-semibold leading-tight text-amber-50">
          {origin.name}
        </h2>
        <p className="shrink-0 text-sm font-medium text-amber-300/90">
          {origin.title}
        </p>

        <p className="origin-description mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm leading-relaxed text-amber-100/85 [-webkit-overflow-scrolling:touch]">
          {origin.description}
        </p>

        <p className="mt-2 shrink-0 text-[10px] leading-relaxed text-amber-200/50">
          Baş Sefir öldü. Saray zayıflık kokuyor.
        </p>

        <div className="mt-2.5 flex shrink-0 justify-center">
          <button
            type="button"
            onClick={onBegin}
            className="game-cta-link hero-menu-link origin-begin-link font-heading flex min-h-[44px] min-w-[44px] items-center justify-center px-5 py-2 text-[11px] font-semibold uppercase text-amber-200/82"
          >
            Başla
          </button>
        </div>
      </div>
    </section>
  );
}
