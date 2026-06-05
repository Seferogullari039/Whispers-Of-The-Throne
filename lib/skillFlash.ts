import type { SkillKey, Skills } from "@/types/game";
import { SKILL_KEYS } from "@/types/game";

export type SkillFlashKind = "rise" | "fall";

export type SkillFlashes = Partial<Record<SkillKey, SkillFlashKind>>;

export function getSkillFlashes(before: Skills, after: Skills): SkillFlashes {
  const flashes: SkillFlashes = {};
  for (const key of SKILL_KEYS) {
    const delta = after[key] - before[key];
    if (delta > 0) flashes[key] = "rise";
    else if (delta < 0) flashes[key] = "fall";
  }
  return flashes;
}
