/** Kart görselleri: public/card-art/{imageKey}.jpg */

export function getCardArtPath(imageKey?: string): string | null {
  if (!imageKey?.trim()) return null;
  const safe = imageKey.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) return null;
  return `/card-art/${safe}.jpg`;
}

export type ActTone = {
  gradient: string;
  glow: string;
  vignette: string;
};

export const ACT_TONES: Record<number, ActTone> = {
  1: {
    gradient:
      "from-stone-900/90 via-zinc-950/95 to-neutral-950",
    glow: "rgba(120,110,100,0.2)",
    vignette: "rgba(20,18,16,0.75)",
  },
  2: {
    gradient:
      "from-slate-900/90 via-cyan-950/40 to-black",
    glow: "rgba(40,80,100,0.25)",
    vignette: "rgba(10,20,30,0.8)",
  },
  3: {
    gradient:
      "from-amber-950/90 via-yellow-950/30 to-black",
    glow: "rgba(180,140,50,0.22)",
    vignette: "rgba(40,30,10,0.75)",
  },
  4: {
    gradient:
      "from-violet-950/90 via-purple-950/50 to-black",
    glow: "rgba(100,60,140,0.28)",
    vignette: "rgba(25,10,40,0.8)",
  },
  5: {
    gradient:
      "from-red-950/80 via-black to-zinc-950",
    glow: "rgba(140,30,30,0.3)",
    vignette: "rgba(30,5,5,0.85)",
  },
};

export function resolveActTone(act?: number[]): ActTone {
  const primary = act?.[0] ?? 1;
  return ACT_TONES[primary] ?? ACT_TONES[1]!;
}
