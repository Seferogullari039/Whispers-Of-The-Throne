import { CardArtScene } from "@/components/CardArtScene";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import { getEndingScene } from "@/lib/endingScene";
import type { Ending, PlayerLevel } from "@/types/game";
import { getRankTitle } from "@/lib/ranks";

const ENDING_STYLES: Record<
  Ending["type"],
  { border: string; badge: string; badgeText: string; ctaClass: string }
> = {
  bad: {
    border: "border-rose-900/50",
    badge: "bg-rose-950/80 text-rose-300/90",
    badgeText: "Çöküş",
    ctaClass: "game-cta-link game-cta-link-bad",
  },
  neutral: {
    border: "border-amber-800/50",
    badge: "bg-amber-950/80 text-amber-300/90",
    badgeText: "Kader",
    ctaClass: "game-cta-link",
  },
  good: {
    border: "border-emerald-900/50",
    badge: "bg-emerald-950/80 text-emerald-300/90",
    badgeText: "Yükseliş",
    ctaClass: "game-cta-link game-cta-link-good",
  },
  true: {
    border: "border-yellow-700/50",
    badge: "bg-yellow-950/80 text-yellow-200/90",
    badgeText: "Gerçek Son",
    ctaClass: "game-cta-link game-cta-link-true",
  },
};

type EndingScreenProps = {
  ending: Ending;
  level: PlayerLevel;
  turnsPlayed: number;
  onRestart: () => void;
};

export function EndingScreen({
  ending,
  level,
  turnsPlayed,
  onRestart,
}: EndingScreenProps) {
  const style = ENDING_STYLES[ending.type];
  const paragraphs = ending.description.split("\n\n");
  const scene = getEndingScene(ending);

  return (
    <section
      className={`game-panel mx-auto flex h-full min-h-0 w-full max-h-full flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-black/75 to-black/95 shadow-lg shadow-black/50 ${style.border}`}
    >
      <CardArtScene
        imageKey={scene.imageKey}
        imagePrompt={ending.imagePrompt}
        act={scene.act}
        sceneKey={scene.sceneKey}
        aspectClass={CARD_PORTRAIT_ART_CLASS}
        className="rounded-none border-0"
      />

      <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${style.badge}`}
          >
            {style.badgeText}
          </span>
          <span className="text-[10px] tabular-nums text-amber-200/50">
            Sv. {level} · {turnsPlayed} hamle
          </span>
        </div>

        <h2 className="shrink-0 text-lg font-semibold leading-tight text-amber-50">
          {ending.title}
        </h2>
        <p className="mt-0.5 shrink-0 text-xs text-amber-300/80">
          {ending.subtitle}
        </p>
        <p className="mt-0.5 shrink-0 text-[10px] text-amber-500/40">
          {getRankTitle(level)}
        </p>

        <div className="mt-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 text-left text-sm leading-relaxed text-amber-100/85 [-webkit-overflow-scrolling:touch]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={onRestart}
          className={`hero-menu-link font-heading mt-2.5 flex min-h-[44px] w-full shrink-0 items-center justify-center px-6 text-[11px] font-semibold uppercase transition duration-300 active:scale-[0.98] hover:scale-[1.02] ${style.ctaClass}`}
        >
          Yeniden Başla
        </button>
      </div>
    </section>
  );
}
