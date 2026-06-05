import { CardArtScene } from "@/components/CardArtScene";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import { getEndingScene } from "@/lib/endingScene";
import type { Ending, PlayerLevel } from "@/types/game";
import { getRankTitle } from "@/lib/ranks";

const ENDING_STYLES: Record<
  Ending["type"],
  { border: string; badge: string; badgeText: string; button: string }
> = {
  bad: {
    border: "border-rose-900/50",
    badge: "bg-rose-950/80 text-rose-300/90",
    badgeText: "Çöküş",
    button: "bg-rose-700 hover:bg-rose-600",
  },
  neutral: {
    border: "border-amber-800/50",
    badge: "bg-amber-950/80 text-amber-300/90",
    badgeText: "Kader",
    button: "bg-amber-700 hover:bg-amber-600",
  },
  good: {
    border: "border-emerald-900/50",
    badge: "bg-emerald-950/80 text-emerald-300/90",
    badgeText: "Yükseliş",
    button: "bg-emerald-700 hover:bg-emerald-600",
  },
  true: {
    border: "border-yellow-700/50",
    badge: "bg-yellow-950/80 text-yellow-200/90",
    badgeText: "Gerçek Son",
    button: "bg-yellow-600 text-amber-950 hover:bg-yellow-500",
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
      className={`game-panel mx-auto flex w-full max-h-[min(94dvh,860px)] min-h-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-black/75 to-black/95 shadow-lg shadow-black/50 ${style.border}`}
    >
      <CardArtScene
        imageKey={scene.imageKey}
        imagePrompt={ending.imagePrompt}
        act={scene.act}
        sceneKey={scene.sceneKey}
        aspectClass={CARD_PORTRAIT_ART_CLASS}
        className="rounded-none border-0"
      />

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
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
        <p className="mt-0.5 shrink-0 text-xs text-amber-300/80">{ending.subtitle}</p>
        <p className="mt-0.5 shrink-0 text-[10px] text-amber-500/40">{getRankTitle(level)}</p>

        <div className="mt-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 text-left text-sm leading-relaxed text-amber-100/85 [-webkit-overflow-scrolling:touch]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={onRestart}
          className={`mt-2.5 min-h-[46px] w-full shrink-0 rounded-xl px-6 text-sm font-semibold text-white transition active:scale-[0.98] ${style.button}`}
        >
          Yeniden Başla
        </button>
      </div>
    </section>
  );
}
