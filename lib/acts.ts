import type { PlayerLevel, StoryCardData } from "@/types/game";

export type ActNumber = 1 | 2 | 3 | 4 | 5;

export type ActInfo = {
  act: ActNumber;
  title: string;
  subtitle: string;
  levelMin: number;
  levelMax: number;
};

export const ACTS: ActInfo[] = [
  { act: 1, title: "Bölüm I", subtitle: "Sokaklar", levelMin: 0, levelMax: 19 },
  { act: 2, title: "Bölüm II", subtitle: "Yeraltı ve Ticaret", levelMin: 20, levelMax: 39 },
  { act: 3, title: "Bölüm III", subtitle: "Şehir Gücü", levelMin: 40, levelMax: 59 },
  { act: 4, title: "Bölüm IV", subtitle: "Saray", levelMin: 60, levelMax: 79 },
  { act: 5, title: "Bölüm V", subtitle: "Tahtın Gölgesi", levelMin: 80, levelMax: 99 },
];

export function getActForLevel(level: PlayerLevel): ActNumber {
  if (level >= 80) return 5;
  if (level >= 60) return 4;
  if (level >= 40) return 3;
  if (level >= 20) return 2;
  return 1;
}

export function getActInfo(level: PlayerLevel): ActInfo {
  const act = getActForLevel(level);
  return ACTS.find((a) => a.act === act) ?? ACTS[0]!;
}

export function cardMatchesAct(card: StoryCardData, act: ActNumber): boolean {
  if (!card.act?.length) return true;
  return card.act.includes(act);
}

export function cardMatchesActWindow(
  card: StoryCardData,
  act: ActNumber,
  window = 1,
): boolean {
  if (!card.act?.length) return true;
  return card.act.some((a) => Math.abs(a - act) <= window);
}

export function isChainGatedCard(card: StoryCardData): boolean {
  return Boolean(card.requirements?.length);
}
