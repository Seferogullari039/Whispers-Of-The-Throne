import type { SkillKey, Skills } from "@/types/game";
import { SKILL_KEYS, SKILL_LABELS } from "@/types/game";

/** Dev panel için sayısal delta */
export type SkillDelta = {
  key: SkillKey;
  label: string;
  delta: number;
};

/** Oyuncuya gösterilen soyut geri bildirim */
export type SkillEffectFeedback = {
  key: SkillKey;
  message: string;
};

export function getSkillDeltas(before: Skills, after: Skills): SkillDelta[] {
  return SKILL_KEYS.map((key) => ({
    key,
    label: SKILL_LABELS[key],
    delta: after[key] - before[key],
  })).filter((entry) => entry.delta !== 0);
}

function feedbackForSkill(key: SkillKey, delta: number): string {
  const label = SKILL_LABELS[key];
  const abs = Math.abs(delta);
  const up = delta > 0;

  if (key === "suspicion") {
    if (up) {
      if (abs >= 9) return "Şüphe tehlikeli biçimde yükseldi.";
      if (abs >= 4) return "Şüphe arttı; gözler üzerinde.";
      return "Şüphe hafifçe arttı.";
    }
    if (abs >= 9) return "Şüphe belirgin şekilde azaldı.";
    if (abs >= 4) return "Şüphe biraz sakinleşti.";
    return "Şüphe hafifçe azaldı.";
  }

  if (key === "loyalty") {
    if (up) {
      if (abs >= 9) return "Sadakat güçlendi; yanın doluyor.";
      if (abs >= 4) return "Sadakat arttı.";
      return "Sadakat hafifçe arttı.";
    }
    if (abs >= 9) return "Sadakat sarsıldı.";
    if (abs >= 4) return "Sadakat zayıfladı.";
    return "Sadakat hafifçe azaldı.";
  }

  if (key === "wealth") {
    if (up) {
      if (abs >= 9) return "Servetin belirgin şekilde güçlendi.";
      if (abs >= 4) return "Servetin arttı.";
      return "Servetin hafifçe arttı.";
    }
    if (abs >= 9) return "Servetin ciddi şekilde eridi.";
    if (abs >= 4) return "Servetin azaldı.";
    return "Servetin hafifçe azaldı.";
  }

  // influence
  if (up) {
    if (abs >= 9) return `${label} sarayda güçlendi.`;
    if (abs >= 4) return `${label} arttı.`;
    return `${label} hafifçe arttı.`;
  }
  if (abs >= 9) return `${label} zayıfladı; kapılar kapanıyor.`;
  if (abs >= 4) return `${label} azaldı.`;
  return `${label} hafifçe azaldı.`;
}

export function getSkillEffectFeedbacks(
  before: Skills,
  after: Skills,
): SkillEffectFeedback[] {
  return SKILL_KEYS.map((key) => {
    const delta = after[key] - before[key];
    return { key, delta, message: feedbackForSkill(key, delta) };
  })
    .filter((entry) => entry.delta !== 0)
    .map(({ key, message }) => ({ key, message }));
}
