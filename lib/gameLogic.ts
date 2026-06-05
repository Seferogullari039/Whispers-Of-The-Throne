import type {
  CardChoice,
  CardRequirement,
  GameFlags,
  GameOverReason,
  Origin,
  PlayerLevel,
  SkillEffects,
  Skills,
  StoryCardData,
} from "@/types/game";
import { INITIAL_SKILLS, SKILL_KEYS, SKILL_LABELS } from "@/types/game";
import { origins } from "@/data/origins";
import {
  chainStoryCards,
  commonStoryCards,
  getCardById,
  rareStoryCards,
} from "@/data/cards";
import { fallbackStoryCards } from "@/data/fallbackCards";
import {
  cardMatchesAct,
  cardMatchesActWindow,
  getActForLevel,
  isChainGatedCard,
} from "@/lib/acts";

export function createInitialSkills(): Skills {
  return { ...INITIAL_SKILLS };
}

export function createInitialFlags(): GameFlags {
  return {};
}

export function createSkillsFromOrigin(origin: Origin): Skills {
  return applyEffects(createInitialSkills(), origin.startingSkillEffects);
}

export function pickRandomOrigin(): Origin {
  const index = Math.floor(Math.random() * origins.length);
  return origins[index]!;
}

export function buildDeckForOrigin(origin: Origin): StoryCardData[] {
  const introSet = new Set(origin.introCardIds);
  const introCards = origin.introCardIds
    .map((id) => getCardById(id))
    .filter((card): card is StoryCardData => card !== undefined);
  const commonDeck = commonStoryCards.filter((card) => !introSet.has(card.id));

  return [...introCards, ...commonDeck, ...chainStoryCards, ...rareStoryCards];
}

export function checkRequirements(
  card: StoryCardData,
  flags: GameFlags,
): boolean {
  if (!card.requirements?.length) return true;

  return card.requirements.every((req) => matchesRequirement(req, flags));
}

function matchesRequirement(
  req: CardRequirement,
  flags: GameFlags,
): boolean {
  const value = flags[req.flag];

  if (req.equals !== undefined) {
    return value === req.equals;
  }

  return value !== undefined && value !== false && value !== "";
}

export function applyFlagChanges(
  flags: GameFlags,
  card: StoryCardData,
  side: "left" | "right",
): GameFlags {
  const choice: CardChoice = side === "left" ? card.leftChoice : card.rightChoice;
  const next: GameFlags = { ...flags };

  const setSources = [card.setFlags, choice.setFlags];
  for (const source of setSources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      next[key] = value;
    }
  }

  const removeKeys = [
    ...(card.removeFlags ?? []),
    ...(choice.removeFlags ?? []),
  ];
  for (const key of removeKeys) {
    delete next[key];
  }

  return next;
}

/** Run boyunca görülen kartlar bir daha seçilmez. */
export function getAvailableCards(
  deck: StoryCardData[],
  flags: GameFlags,
  seenCardIds: Set<string> | string[],
): StoryCardData[] {
  const seen =
    seenCardIds instanceof Set ? seenCardIds : new Set(seenCardIds);

  return deck.filter((card) => {
    if (seen.has(card.id)) return false;
    return checkRequirements(card, flags);
  });
}

export function markCardSeen(
  seenCardIds: Set<string>,
  card: StoryCardData,
): Set<string> {
  const next = new Set(seenCardIds);
  next.add(card.id);
  return next;
}

function pickRandomFrom(cards: StoryCardData[]): StoryCardData | null {
  if (cards.length === 0) return null;
  const index = Math.floor(Math.random() * cards.length);
  return cards[index] ?? null;
}

function prioritizeByAct(
  cards: StoryCardData[],
  level: PlayerLevel,
): StoryCardData[] {
  const act = getActForLevel(level);
  const inAct = cards.filter((c) => cardMatchesAct(c, act));
  if (inAct.length > 0) return inAct;

  const windowed = cards.filter((c) => cardMatchesActWindow(c, act, 1));
  if (windowed.length > 0) return windowed;

  return cards;
}

function selectFromPool(
  candidates: StoryCardData[],
  level: PlayerLevel,
): StoryCardData | null {
  if (candidates.length === 0) return null;

  const chainGated = candidates.filter(isChainGatedCard);
  if (chainGated.length > 0) {
    return pickRandomFrom(prioritizeByAct(chainGated, level));
  }

  return pickRandomFrom(prioritizeByAct(candidates, level));
}

function pickFallbackCard(
  flags: GameFlags,
  seenCardIds: Set<string>,
  level: PlayerLevel,
  excludeCardId?: string,
): StoryCardData | null {
  let available = getAvailableCards(fallbackStoryCards, flags, seenCardIds);

  if (excludeCardId) {
    const without = available.filter((c) => c.id !== excludeCardId);
    if (without.length > 0) available = without;
  }

  return selectFromPool(available, level);
}

export function pickNextCard(
  pool: StoryCardData[],
  flags: GameFlags,
  seenCardIds: Set<string>,
  introQueue: readonly string[],
  playerLevel: PlayerLevel,
  excludeCardId?: string,
): StoryCardData | null {
  const introIds = new Set(introQueue);

  if (introQueue.length > 0) {
    const introId = introQueue[0]!;
    const introCard = getCardById(introId);

    if (
      introCard &&
      !seenCardIds.has(introCard.id) &&
      checkRequirements(introCard, flags)
    ) {
      return introCard;
    }
  }

  let available = getAvailableCards(pool, flags, seenCardIds).filter(
    (card) => !introIds.has(card.id),
  );

  if (excludeCardId) {
    const withoutExcluded = available.filter((c) => c.id !== excludeCardId);
    if (withoutExcluded.length > 0) {
      available = withoutExcluded;
    }
  }

  const picked = selectFromPool(available, playerLevel);
  if (picked) return picked;

  return pickFallbackCard(flags, seenCardIds, playerLevel, excludeCardId);
}

export function mergeEffects(
  cardEffects: SkillEffects,
  choiceEffects: SkillEffects,
): SkillEffects {
  const merged: SkillEffects = { ...cardEffects };

  for (const key of SKILL_KEYS) {
    const choiceDelta = choiceEffects[key];
    if (choiceDelta === undefined) continue;
    merged[key] = (merged[key] ?? 0) + choiceDelta;
  }

  return merged;
}

export function applyEffects(skills: Skills, effects: SkillEffects): Skills {
  const next = { ...skills };

  for (const key of SKILL_KEYS) {
    const delta = effects[key];
    if (delta === undefined) continue;
    next[key] = next[key] + delta;
  }

  return next;
}

export function clampSkillValue(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function getDisplaySkills(skills: Skills): Skills {
  return {
    wealth: clampSkillValue(skills.wealth),
    influence: clampSkillValue(skills.influence),
    suspicion: clampSkillValue(skills.suspicion),
    loyalty: clampSkillValue(skills.loyalty),
  };
}

export function getGameOverReason(skills: Skills): GameOverReason | null {
  for (const key of SKILL_KEYS) {
    if (skills[key] <= 0) {
      return { skill: key, direction: "too_low" };
    }
    if (skills[key] >= 100) {
      return { skill: key, direction: "too_high" };
    }
  }
  return null;
}

export function getChoiceEffects(
  card: StoryCardData,
  side: "left" | "right",
): SkillEffects {
  const choice = side === "left" ? card.leftChoice : card.rightChoice;
  return mergeEffects(card.effects, choice.effects);
}

export function getGameOverMessage(reason: GameOverReason): string {
  const skillName = SKILL_LABELS[reason.skill];
  if (reason.direction === "too_low") {
    return `${skillName} çöktü. Saray zayıflığını artık tolere etmiyor.`;
  }
  return `${skillName} kontrolden çıktı. Diyar sana döndü.`;
}
