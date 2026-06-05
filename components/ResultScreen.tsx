import { CardArtScene } from "@/components/CardArtScene";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import type { SkillEffectFeedback } from "@/lib/skillDeltas";

type ResultScreenProps = {
  choiceLabel: string;
  resultText: string;
  skillFeedbacks: SkillEffectFeedback[];
  imageKey?: string;
  imagePrompt?: string;
  act?: number[];
  tags?: string[];
  showDevPrompt?: boolean;
  onContinue: () => void;
};

export function ResultScreen({
  choiceLabel,
  resultText,
  skillFeedbacks,
  imageKey,
  imagePrompt,
  act,
  tags,
  showDevPrompt = false,
  onContinue,
}: ResultScreenProps) {
  return (
    <section className="game-panel mx-auto flex w-full max-h-[min(94dvh,860px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-700/50 bg-gradient-to-b from-amber-950/70 to-black/80 shadow-lg shadow-black/40">
      <CardArtScene
        imageKey={imageKey}
        imagePrompt={imagePrompt}
        act={act}
        tags={tags}
        compact
        showDevPrompt={showDevPrompt}
        aspectClass={CARD_PORTRAIT_ART_CLASS}
        className="rounded-none border-0 border-b border-amber-800/40"
      />

      <div className="flex min-h-0 flex-1 flex-col p-3 pt-2.5">
        <p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-amber-400/45">
          Sonuç · {choiceLabel}
        </p>

        <p className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain text-[15px] leading-[1.65] text-amber-50/92 [-webkit-overflow-scrolling:touch]">
          {resultText}
        </p>

        {skillFeedbacks.length > 0 && (
          <p className="mt-1.5 line-clamp-2 text-[10px] italic leading-snug text-amber-300/50">
            {skillFeedbacks.map((f) => f.message).join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="mt-2.5 min-h-[46px] w-full shrink-0 rounded-xl bg-amber-600 px-6 text-sm font-semibold text-amber-950 transition active:scale-[0.98] hover:bg-amber-500"
        >
          Devam Et
        </button>
      </div>
    </section>
  );
}
