export type GameMusicPhase =
  | "hero"
  | "origin_intro"
  | "playing"
  | "result"
  | "ending";

export type EndingType = "bad" | "neutral" | "good" | "true";

export const MENU_TRACK = "menu-theme";
export const ORIGIN_TRACK = "origin-theme";

/** Pass #6 — act-aligned journey arcs (HUD: Küller → Taht) */
export const JOURNEY_TRACKS = {
  early: "journey-early",
  streets: "journey-streets",
  trade: "journey-trade",
  court: "journey-court",
  throne: "journey-throne",
} as const;

export type JourneyTrackId =
  (typeof JOURNEY_TRACKS)[keyof typeof JOURNEY_TRACKS];

export const ENDING_TRACKS: Record<EndingType, string> = {
  bad: "ending-bad",
  neutral: "ending-neutral",
  good: "ending-good",
  true: "ending-true",
};

/** Level → journey arc (act-aligned brackets; HUD uses act names). */
export function getJourneyTrackForLevel(level: number): JourneyTrackId {
  const lv = Math.min(99, Math.max(0, Math.floor(level)));
  if (lv < 20) return JOURNEY_TRACKS.early;
  if (lv < 40) return JOURNEY_TRACKS.streets;
  if (lv < 60) return JOURNEY_TRACKS.trade;
  if (lv < 80) return JOURNEY_TRACKS.court;
  return JOURNEY_TRACKS.throne;
}

export function getEndingTrack(endingType: EndingType): string {
  return ENDING_TRACKS[endingType];
}

/** Phase + level (+ ending type) → track base name (no extension). */
export function getMusicTrackForLevel(
  level: number,
  phase: GameMusicPhase,
  endingType?: EndingType,
): string {
  if (phase === "hero") return MENU_TRACK;
  if (phase === "origin_intro") return ORIGIN_TRACK;
  if (phase === "ending") {
    return endingType ? getEndingTrack(endingType) : ENDING_TRACKS.neutral;
  }
  return getJourneyTrackForLevel(level);
}

export const ALL_MUSIC_TRACKS = [
  MENU_TRACK,
  ORIGIN_TRACK,
  ...Object.values(JOURNEY_TRACKS),
  ...Object.values(ENDING_TRACKS),
] as const;

/** Dev / docs — level bracket → file */
export const LEVEL_JOURNEY_MAP: ReadonlyArray<{
  levels: string;
  act: string;
  track: JourneyTrackId;
}> = [
  { levels: "0–19", act: "Küller", track: JOURNEY_TRACKS.early },
  { levels: "20–39", act: "Fısıltılar", track: JOURNEY_TRACKS.streets },
  { levels: "40–59", act: "Gölgeler", track: JOURNEY_TRACKS.trade },
  { levels: "60–79", act: "Mühürler", track: JOURNEY_TRACKS.court },
  { levels: "80–99", act: "Taht", track: JOURNEY_TRACKS.throne },
];
