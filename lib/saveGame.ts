import { getCardById } from "@/data/cards";
import { getEndingById } from "@/data/endings";
import { getOriginById } from "@/data/origins";
import { getRankTitle } from "@/lib/ranks";
import type { SkillEffectFeedback } from "@/lib/skillDeltas";
import type {
  Ending,
  GameFlags,
  GamePhase,
  Origin,
  PlayerLevel,
  Skills,
  StoryCardData,
} from "@/types/game";

const STORAGE_KEY = "whispers-of-the-throne-save";
const SAVE_VERSION = 2;

export type SavedPendingResult = {
  choiceLabel: string;
  resultText: string;
  skillFeedbacks: SkillEffectFeedback[];
  resultImageKey?: string;
  resultImagePrompt?: string;
  resultAct?: number[];
  resultTags?: string[];
  pendingEndingId: string | null;
  nextCardId: string | null;
  introQueueAfter: string[];
};

export type SavedGameState = {
  version: number;
  skills: Skills;
  playerLevel: PlayerLevel;
  rank: string;
  flags: GameFlags;
  seenCardIds: string[];
  currentCardId: string | null;
  originId: string;
  deckCardIds: string[];
  gamePhase: GamePhase;
  introQueue: string[];
  turnsPlayed: number;
  pendingResult: SavedPendingResult | null;
  activeEndingId: string | null;
};

export type PendingResultState = {
  choiceLabel: string;
  resultText: string;
  skillFeedbacks: SkillEffectFeedback[];
  resultImageKey?: string;
  resultImagePrompt?: string;
  resultAct?: number[];
  resultTags?: string[];
  pendingEnding: Ending | null;
  nextCard: StoryCardData | null;
  introQueueAfter: string[];
};

export type RestoredGameState = {
  session: {
    origin: Origin;
    deck: StoryCardData[];
    skills: Skills;
  };
  phase: GamePhase;
  currentCard: StoryCardData | null;
  introQueue: string[];
  flags: GameFlags;
  seenCardIds: Set<string>;
  playerLevel: PlayerLevel;
  rank: string;
  turnsPlayed: number;
  activeEnding: Ending | null;
  pendingResult: PendingResultState | null;
};

export type GameSaveInput = {
  skills: Skills;
  playerLevel: PlayerLevel;
  flags: GameFlags;
  seenCardIds: Set<string>;
  currentCard: StoryCardData | null;
  origin: Origin;
  deck: StoryCardData[];
  gamePhase: GamePhase;
  introQueue: string[];
  turnsPlayed: number;
  pendingResult: PendingResultState | null;
  activeEnding: Ending | null;
};

function resolveCards(ids: string[]): StoryCardData[] {
  return ids
    .map((id) => getCardById(id))
    .filter((card): card is StoryCardData => card !== undefined);
}

function isPersistablePhase(phase: GamePhase): boolean {
  return (
    phase !== "intro" &&
    phase !== "hero" &&
    phase !== "start_menu" &&
    phase !== "ending"
  );
}

export function buildSavedGameState(input: GameSaveInput): SavedGameState {
  return {
    version: SAVE_VERSION,
    skills: input.skills,
    playerLevel: input.playerLevel,
    rank: getRankTitle(input.playerLevel),
    flags: input.flags,
    seenCardIds: [...input.seenCardIds],
    currentCardId: input.currentCard?.id ?? null,
    originId: input.origin.id,
    deckCardIds: input.deck.map((card) => card.id),
    gamePhase: input.gamePhase,
    introQueue: input.introQueue,
    turnsPlayed: input.turnsPlayed,
    pendingResult: input.pendingResult
      ? {
          choiceLabel: input.pendingResult.choiceLabel,
          resultText: input.pendingResult.resultText,
          skillFeedbacks: input.pendingResult.skillFeedbacks,
          resultImageKey: input.pendingResult.resultImageKey,
          resultImagePrompt: input.pendingResult.resultImagePrompt,
          resultAct: input.pendingResult.resultAct,
          resultTags: input.pendingResult.resultTags,
          pendingEndingId: input.pendingResult.pendingEnding?.id ?? null,
          nextCardId: input.pendingResult.nextCard?.id ?? null,
          introQueueAfter: input.pendingResult.introQueueAfter,
        }
      : null,
    activeEndingId: input.activeEnding?.id ?? null,
  };
}

export function saveGameState(input: GameSaveInput): void {
  if (typeof window === "undefined") return;
  if (!isPersistablePhase(input.gamePhase)) return;

  try {
    const payload = buildSavedGameState(input);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function loadGameState(): RestoredGameState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as SavedGameState;
    if (saved.version !== SAVE_VERSION) return null;

    const origin = getOriginById(saved.originId);
    if (!origin) return null;

    const deck = resolveCards(saved.deckCardIds);
    if (deck.length === 0) return null;

    const currentCard = saved.currentCardId
      ? getCardById(saved.currentCardId) ?? null
      : null;

    let pendingResult: PendingResultState | null = null;
    if (saved.pendingResult) {
      pendingResult = {
        choiceLabel: saved.pendingResult.choiceLabel,
        resultText: saved.pendingResult.resultText,
        skillFeedbacks: saved.pendingResult.skillFeedbacks ?? [],
        resultImageKey: saved.pendingResult.resultImageKey,
        resultImagePrompt: saved.pendingResult.resultImagePrompt,
        resultAct: saved.pendingResult.resultAct,
        resultTags: saved.pendingResult.resultTags,
        pendingEnding: saved.pendingResult.pendingEndingId
          ? getEndingById(saved.pendingResult.pendingEndingId)
          : null,
        nextCard: saved.pendingResult.nextCardId
          ? getCardById(saved.pendingResult.nextCardId) ?? null
          : null,
        introQueueAfter: saved.pendingResult.introQueueAfter,
      };
    }

    const activeEnding = saved.activeEndingId
      ? getEndingById(saved.activeEndingId)
      : null;

    if (saved.gamePhase === "ending") return null;

    return {
      session: { origin, deck, skills: saved.skills },
      phase: saved.gamePhase,
      currentCard,
      introQueue: saved.introQueue,
      flags: saved.flags,
      seenCardIds: new Set(saved.seenCardIds),
      playerLevel: saved.playerLevel,
      rank: saved.rank,
      turnsPlayed: saved.turnsPlayed,
      activeEnding,
      pendingResult,
    };
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedGame(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getSavedGamePreview(): {
  rank: string;
  playerLevel: PlayerLevel;
  originName: string;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as SavedGameState;
    const origin = getOriginById(saved.originId);
    if (!origin || saved.gamePhase === "ending") return null;

    return {
      rank: saved.rank,
      playerLevel: saved.playerLevel,
      originName: origin.name,
    };
  } catch {
    return null;
  }
}
