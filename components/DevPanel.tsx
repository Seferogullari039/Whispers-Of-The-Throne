"use client";

import { useState } from "react";
import type { GameFlags, Origin, PlayerLevel, Skills } from "@/types/game";
import { SKILL_KEYS, SKILL_LABELS } from "@/types/game";

const IS_DEV = process.env.NODE_ENV === "development";

export type DevPanelActions = {
  onAddLevel: () => void;
  onSetSkillsTo50: () => void;
  onTriggerWealthLow: () => void;
  onTriggerSuspicionHigh: () => void;
  onClearSave: () => void;
  onForceRandomNextCard: () => void;
};

type DevPanelProps = {
  origin: Origin;
  currentCardId: string | null;
  phase: string;
  playerLevel: PlayerLevel;
  rank: string;
  skills: Skills;
  flags: GameFlags;
  seenCardCount: number;
  turnsPlayed: number;
  actions: DevPanelActions;
};

export function DevPanel({
  origin,
  currentCardId,
  phase,
  playerLevel,
  rank,
  skills,
  flags,
  seenCardCount,
  turnsPlayed,
  actions,
}: DevPanelProps) {
  if (!IS_DEV) return null;

  return <DevPanelContent {...{ origin, currentCardId, phase, playerLevel, rank, skills, flags, seenCardCount, turnsPlayed, actions }} />;
}

function DevPanelContent({
  origin,
  currentCardId,
  phase,
  playerLevel,
  rank,
  skills,
  flags,
  seenCardCount,
  turnsPlayed,
  actions,
}: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const flagEntries = Object.entries(flags);

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+3rem)] z-50 flex w-52 max-w-[calc(100vw-1.5rem)] flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto rounded-full border border-violet-800/60 bg-violet-950/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-violet-200/90 backdrop-blur-sm"
      >
        Dev
      </button>

      {open && (
        <div className="pointer-events-auto mt-1.5 max-h-[min(70dvh,520px)] w-full overflow-y-auto rounded-lg border border-violet-900/50 bg-black/92 p-2.5 text-[10px] shadow-lg backdrop-blur-sm">
          <p className="mb-2 font-semibold uppercase tracking-wide text-violet-400/80">
            Geliştirici paneli
          </p>

          <dl className="space-y-1 text-amber-100/80">
            <Row label="Aşama" value={phase} />
            <Row label="Köken" value={`${origin.name} (${origin.id})`} />
            <Row label="Kart" value={currentCardId ?? "—"} />
            <Row label="Seviye" value={String(playerLevel)} />
            <Row label="Unvan" value={rank} />
            <Row label="Hamle" value={String(turnsPlayed)} />
            <Row label="Görülen kart" value={String(seenCardCount)} />
          </dl>

          <div className="mt-2 grid grid-cols-2 gap-1">
            {SKILL_KEYS.map((key) => (
              <div
                key={key}
                className="rounded bg-amber-950/50 px-1.5 py-0.5 tabular-nums"
              >
                <span className="text-amber-500/70">{SKILL_LABELS[key]}</span>{" "}
                {skills[key]}
              </div>
            ))}
          </div>

          <div className="mt-2 border-t border-violet-900/40 pt-2">
            <p className="mb-1 font-semibold uppercase tracking-wide text-amber-500/70">
              Hafıza / bayraklar
            </p>
            {flagEntries.length === 0 ? (
              <p className="text-amber-200/40">— yok —</p>
            ) : (
              <ul className="max-h-20 space-y-0.5 overflow-y-auto font-mono text-amber-100/80">
                {flagEntries.map(([key, value]) => (
                  <li key={key} className="leading-tight">
                    <span className="text-amber-400/90">{key}</span>
                    <span className="text-amber-200/50">=</span>
                    {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 border-t border-violet-900/40 pt-2">
            <DevButton label="+10 Seviye" onClick={actions.onAddLevel} />
            <DevButton label="Yetenekler → 50" onClick={actions.onSetSkillsTo50} />
            <DevButton
              label="Servet Düşük (0)"
              onClick={actions.onTriggerWealthLow}
            />
            <DevButton
              label="Şüphe Yüksek (100)"
              onClick={actions.onTriggerSuspicionHigh}
            />
            <DevButton label="Kaydı Sil" onClick={actions.onClearSave} />
            <DevButton
              label="Rastgele Sonraki Kart"
              onClick={actions.onForceRandomNextCard}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-amber-500/60">{label}</dt>
      <dd className="truncate text-right font-medium text-amber-50/90">
        {value}
      </dd>
    </div>
  );
}

function DevButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[28px] rounded border border-violet-800/50 bg-violet-950/60 px-2 py-1 text-left text-[9px] font-medium text-violet-100/90 transition active:scale-[0.98] hover:bg-violet-900/50"
    >
      {label}
    </button>
  );
}
