import type { PlayerLevel } from "@/types/game";
import { MAX_PLAYER_LEVEL } from "@/types/game";

const RANK_BY_MIN_LEVEL: { minLevel: number; title: string }[] = [
  { minLevel: 90, title: "Tacın Gölgesi" },
  { minLevel: 80, title: "Tahtın Eli" },
  { minLevel: 70, title: "İmparatorluk Danışmanı" },
  { minLevel: 60, title: "Saray Fısıltısı" },
  { minLevel: 50, title: "Lordun Ajanı" },
  { minLevel: 40, title: "Şehir Gücü" },
  { minLevel: 30, title: "Lonca Eli" },
  { minLevel: 20, title: "Gölge Simsarı" },
  { minLevel: 10, title: "Sokak Koşucusu" },
  { minLevel: 0, title: "İsimsiz" },
];

export function getRankTitle(level: PlayerLevel): string {
  if (level >= MAX_PLAYER_LEVEL) return "Baş Sefir";

  for (const rank of RANK_BY_MIN_LEVEL) {
    if (level >= rank.minLevel) return rank.title;
  }

  return "İsimsiz";
}
