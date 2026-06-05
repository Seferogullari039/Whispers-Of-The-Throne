import { endings, getEndingById } from "@/data/endings";
import type {
  Ending,
  GameEndingReason,
  GameFlags,
  GameOverReason,
  PlayerLevel,
  Skills,
} from "@/types/game";
import { MAX_PLAYER_LEVEL } from "@/types/game";
export function getSkillBoundEndingId(
  reason: GameOverReason,
  level: PlayerLevel,
): string {
  const { skill, direction } = reason;

  if (skill === "wealth" && direction === "too_low") {
    return level < 25 ? "starved-in-gutters" : "buried-by-debt";
  }
  if (skill === "wealth" && direction === "too_high") {
    return "executed-by-crown";
  }
  if (skill === "loyalty" && direction === "too_low") {
    return "betrayed-by-your-own";
  }
  if (skill === "loyalty" && direction === "too_high") {
    return level >= 55 ? "governor-western-gate" : "minor-lord-ashford";
  }
  if (skill === "influence" && direction === "too_low") {
    return "forgotten-clerk";
  }
  if (skill === "influence" && direction === "too_high") {
    return level >= 65 ? "regent-behind-throne" : "executed-by-crown";
  }
  if (skill === "suspicion" && direction === "too_high") {
    return "executed-by-crown";
  }
  if (skill === "suspicion" && direction === "too_low") {
    return level < 30 ? "forgotten-clerk" : "silent-monk";
  }

  return "forgotten-clerk";
}

function endingMatchesLevel(ending: Ending, level: PlayerLevel): boolean {
  if (ending.minLevel !== undefined && level < ending.minLevel) return false;
  if (ending.maxLevel !== undefined && level > ending.maxLevel) return false;
  return true;
}

function endingMeetsFlagRequirements(ending: Ending, flags: GameFlags): boolean {
  if (!ending.requirements?.length) return true;
  return ending.requirements.every((req) => {
    const value = flags[req.flag];
    if (req.equals !== undefined) return value === req.equals;
    return value !== undefined && value !== false && value !== "";
  });
}

export function findEndingByRequirements(
  level: PlayerLevel,
  flags: GameFlags,
): Ending | null {
  for (const ending of endings) {
    if (!ending.requirements?.length) continue;
    if (!endingMatchesLevel(ending, level)) continue;
    if (!endingMeetsFlagRequirements(ending, flags)) continue;
    return ending;
  }
  return null;
}

export function resolveEnding(
  endingReason: GameEndingReason,
  level: PlayerLevel,
  flags: GameFlags,
): Ending {
  if (endingReason.kind === "level_cap") {
    return getEndingById("grand-vizier");
  }

  const flagMatch = findEndingByRequirements(level, flags);
  if (flagMatch) return flagMatch;

  const id = getSkillBoundEndingId(endingReason.reason, level);
  const ending = getEndingById(id);

  if (endingMatchesLevel(ending, level)) {
    return ending;
  }

  return getEndingById("forgotten-clerk");
}

export function detectEndingTrigger(
  skills: Skills,
  level: PlayerLevel,
): GameEndingReason | null {
  if (level >= MAX_PLAYER_LEVEL) {
    return { kind: "level_cap" };
  }

  for (const key of ["wealth", "influence", "suspicion", "loyalty"] as const) {
    if (skills[key] <= 0) {
      return { kind: "skill_bound", reason: { skill: key, direction: "too_low" } };
    }
    if (skills[key] >= 100) {
      return {
        kind: "skill_bound",
        reason: { skill: key, direction: "too_high" },
      };
    }
  }

  return null;
}

export function incrementLevel(level: PlayerLevel): PlayerLevel {
  return Math.min(level + 1, MAX_PLAYER_LEVEL);
}
