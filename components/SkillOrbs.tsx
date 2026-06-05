import type { Skills } from "@/types/game";
import { SKILL_KEYS, SKILL_LABELS } from "@/types/game";
import { clampSkillValue } from "@/lib/gameLogic";
import type { SkillFlashes } from "@/lib/skillFlash";
import { SkillOrb } from "@/components/SkillOrb";

type SkillOrbsProps = {
  skills: Skills;
  flashes?: SkillFlashes;
};

export function SkillOrbs({ skills, flashes = {} }: SkillOrbsProps) {
  return (
    <div
      className="flex w-full items-end justify-between gap-0.5 px-0.5"
      role="group"
      aria-label="Güç göstergeleri"
    >
      {SKILL_KEYS.map((key) => (
        <div
          key={key}
          className="flex min-w-0 flex-1 flex-col items-center"
        >
          <SkillOrb
            skill={key}
            fill={clampSkillValue(skills[key])}
            flash={flashes[key]}
          />
          <span className="-mt-0.5 text-[11px] font-medium leading-none tracking-[0.03em] text-amber-400/68">
            {SKILL_LABELS[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use SkillOrbs */
export function SkillBar(props: SkillOrbsProps) {
  return <SkillOrbs {...props} />;
}
