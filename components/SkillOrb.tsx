import { useId } from "react";
import type { SkillKey } from "@/types/game";
import { SKILL_LABELS } from "@/types/game";
import type { SkillFlashKind } from "@/lib/skillFlash";

const VIEW_SIZE = 48;
const ICON_BOX = 70;

/** Optik merkez hizası — tüm semboller aynı kutuda */
const OPTICAL_OFFSET: Record<SkillKey, string> = {
  wealth: "translate(0, 1.5)",
  influence: "translate(0, 2)",
  suspicion: "translate(0, 0.5)",
  loyalty: "translate(0, 1)",
};

const AMBER = {
  lit: "#e8c878",
  ghost: "#4a4030",
};

type PathMode = "display" | "mask";

function SkillPaths({
  skill,
  mode = "display",
}: {
  skill: SkillKey;
  mode?: PathMode;
}) {
  const stroke = mode === "mask" ? "#ffffff" : "currentColor";
  const fillCoin = mode === "mask" ? "#ffffff" : stroke;

  switch (skill) {
    case "wealth":
      return (
        <>
          <ellipse
            cx="24"
            cy="34"
            rx="14"
            ry="3"
            fill={fillCoin}
            opacity={mode === "mask" ? 1 : 0.25}
          />
          <circle cx="24" cy="22" r="11" stroke={stroke} strokeWidth="2.5" />
          <circle
            cx="24"
            cy="22"
            r="7"
            stroke={stroke}
            strokeWidth="2"
            opacity={mode === "mask" ? 1 : 0.7}
          />
          <path
            d="M24 14v16M19 19h10M19 25h10"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      );
    case "influence":
      return (
        <>
          <path
            d="M10 18h6l2-4 2 8 2-6 2 3h6"
            stroke={stroke}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 28c0 5.5 4.5 10 10 10s10-4.5 10-10"
            stroke={stroke}
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="28"
            r="4"
            fill={fillCoin}
            opacity={mode === "mask" ? 1 : 0.85}
          />
          {mode === "display" && (
            <circle cx="24" cy="28" r="1.75" fill="#0a0810" />
          )}
        </>
      );
    case "suspicion":
      return (
        <>
          <rect
            x="20"
            y="30"
            width="8"
            height="6"
            rx="1"
            fill={fillCoin}
            opacity={mode === "mask" ? 1 : 0.5}
          />
          <path
            d="M22 30V18c0-2 1.5-4 4-4"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 10c3 0 5 2 5 5 0 4-5 5-5 5s-5-1-5-5c0-3 2-5 5-5z"
            fill={fillCoin}
            opacity={mode === "mask" ? 1 : 0.9}
          />
          <path
            d="M24 6v2M24 16v2"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={mode === "mask" ? 1 : 0.6}
          />
        </>
      );
    case "loyalty":
      return (
        <>
          <path
            d="M24 8L10 14v10c0 9 6 14 14 16 8-2 14-7 14-16V14L24 8z"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M24 14v14M18 20h12"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={mode === "mask" ? 1 : 0.65}
          />
        </>
      );
  }
}

type SkillOrbProps = {
  skill: SkillKey;
  fill: number;
  flash?: SkillFlashKind;
};

export function SkillOrb({ skill, fill, flash }: SkillOrbProps) {
  const clamped = Math.min(100, Math.max(0, fill));
  const dim = clamped < 30;
  const bright = clamped > 72;
  const criticalLow = clamped <= 12;
  const criticalHigh = clamped >= 88;

  const uid = useId().replace(/:/g, "");
  const symbolMaskId = `skill-symbol-${skill}-${uid}`;
  const fillMaskId = `skill-fill-${skill}-${uid}`;

  const fillY = VIEW_SIZE * (1 - clamped / 100);
  const fillH = VIEW_SIZE * (clamped / 100);

  return (
    <div
      className={`skill-symbol flex h-[90px] w-[90px] shrink-0 items-center justify-center ${
        dim ? "skill-symbol-dim" : ""
      } ${bright ? "skill-symbol-bright" : ""} ${
        criticalLow || criticalHigh ? "skill-symbol-critical" : ""
      } ${flash === "rise" ? "skill-symbol-flash-rise" : ""} ${
        flash === "fall" ? "skill-symbol-flash-fall" : ""
      }`}
      role="img"
      aria-label={SKILL_LABELS[skill]}
    >
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        width={ICON_BOX}
        height={ICON_BOX}
        className="block shrink-0 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <mask
            id={symbolMaskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEW_SIZE}
            height={VIEW_SIZE}
          >
            <rect width={VIEW_SIZE} height={VIEW_SIZE} fill="black" />
            <g transform={OPTICAL_OFFSET[skill]}>
              <SkillPaths skill={skill} mode="mask" />
            </g>
          </mask>

          <mask
            id={fillMaskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEW_SIZE}
            height={VIEW_SIZE}
          >
            <rect width={VIEW_SIZE} height={VIEW_SIZE} fill="black" />
            <g mask={`url(#${symbolMaskId})`}>
              <rect
                className="skill-symbol-fill-level"
                x="0"
                y={fillY}
                width={VIEW_SIZE}
                height={fillH}
                fill="white"
              />
            </g>
          </mask>
        </defs>

        <g
          className="skill-symbol-ghost"
          style={{ color: AMBER.ghost }}
          transform={OPTICAL_OFFSET[skill]}
        >
          <SkillPaths skill={skill} mode="display" />
        </g>

        <g
          className="skill-symbol-lit"
          style={{ color: AMBER.lit }}
          mask={`url(#${fillMaskId})`}
          transform={OPTICAL_OFFSET[skill]}
        >
          <SkillPaths skill={skill} mode="display" />
        </g>
      </svg>
    </div>
  );
}
