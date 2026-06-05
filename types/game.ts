export const SKILL_KEYS = [
  "wealth",
  "influence",
  "suspicion",
  "loyalty",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export type Skills = Record<SkillKey, number>;

export type SkillEffects = Partial<Record<SkillKey, number>>;

export type GameFlags = Record<string, boolean | number | string>;

export type CardRequirement = {
  flag: string;
  equals?: boolean | number | string;
};

export type CardChoice = {
  label: string;
  effects: SkillEffects;
  resultText?: string;
  resultImagePrompt?: string;
  resultImageKey?: string;
  setFlags?: Record<string, boolean | number | string>;
  removeFlags?: string[];
};

export type StoryCardData = {
  id: string;
  title: string;
  description: string;
  leftChoice: CardChoice;
  rightChoice: CardChoice;
  effects: SkillEffects;
  requirements?: CardRequirement[];
  setFlags?: Record<string, boolean | number | string>;
  removeFlags?: string[];
  /** @deprecated Run-wide dedup uses seenCardIds; kept for chain semantics */
  once?: boolean;
  chainId?: string;
  /** Acts 1–5 this card may appear in */
  act?: number[];
  tags?: string[];
  imagePrompt?: string;
  imageKey?: string;
  /** Short English scene line for auto image prompt export */
  sceneDescription?: string;
};

export type Origin = {
  id: string;
  name: string;
  title: string;
  description: string;
  /** public/card-art/{imageKey}.jpg */
  imageKey?: string;
  sceneDescription?: string;
  startingSkillEffects: SkillEffects;
  introCardIds: string[];
};

export type GamePhase =
  | "intro"
  | "hero"
  | "start_menu"
  | "origin_intro"
  | "playing"
  | "result"
  | "ending";

export type EndingType = "bad" | "neutral" | "good" | "true";

export type Ending = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: EndingType;
  /** public/card-art/{imageKey}.jpg */
  imageKey?: string;
  imagePrompt?: string;
  sceneDescription?: string;
  minLevel?: number;
  maxLevel?: number;
  requirements?: CardRequirement[];
};

/** Player progression level (0–99). */
export type PlayerLevel = number;

export const INITIAL_PLAYER_LEVEL: PlayerLevel = 0;
export const MAX_PLAYER_LEVEL: PlayerLevel = 99;

export type GameOverReason = {
  skill: SkillKey;
  direction: "too_low" | "too_high";
};

export type GameEndingReason =
  | { kind: "level_cap" }
  | { kind: "skill_bound"; reason: GameOverReason };

export const SKILL_LABELS: Record<SkillKey, string> = {
  wealth: "Servet",
  influence: "Nüfuz",
  suspicion: "Şüphe",
  loyalty: "Sadakat",
};

export const INITIAL_SKILLS: Skills = {
  wealth: 50,
  influence: 50,
  suspicion: 50,
  loyalty: 50,
};
