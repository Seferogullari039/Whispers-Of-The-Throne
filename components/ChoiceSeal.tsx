type ChoiceSealProps = {
  side: "left" | "right";
  progress: number;
  ready: boolean;
};

export function ChoiceSeal({ side, progress, ready }: ChoiceSealProps) {
  const isRight = side === "right";
  const opacity = Math.min(1, progress * 1.1);
  const scale = 0.7 + progress * 0.35;

  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-20 flex -translate-y-1/2 items-center justify-center transition-opacity duration-150 ${
        isRight ? "right-2 sm:right-4" : "left-2 sm:left-4"
      }`}
      style={{ opacity: progress < 0.08 ? 0 : opacity }}
      aria-hidden
    >
      <div
        className={`choice-seal flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 ${
          isRight
            ? "choice-seal-right border-amber-500/50 bg-amber-950/40"
            : "choice-seal-left border-violet-500/50 bg-violet-950/40"
        } ${ready ? "choice-seal-ready" : ""}`}
        style={{ transform: `scale(${scale})` }}
      >
        <svg
          viewBox="0 0 48 48"
          className={`h-10 w-10 ${isRight ? "text-amber-400/90" : "text-violet-400/90"}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.5"
          />
          <path
            d="M24 12 L24 28 M18 20 L24 28 L30 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={isRight ? undefined : "scale(-1,1) translate(-48,0)"}
          />
        </svg>
      </div>
    </div>
  );
}
