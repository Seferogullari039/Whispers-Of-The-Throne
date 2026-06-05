import type { Ending } from "@/types/game";

export type EndingSceneConfig = {
  imageKey?: string;
  sceneKey: string;
  act: number[];
};

/** Görsel yoksa `sceneKey` → EndingSceneArt placeholder */
export const ENDING_SCENES: Record<string, EndingSceneConfig> = {
  "starved-in-gutters": {
    imageKey: "dark-alley",
    sceneKey: "ending-starved",
    act: [1],
  },
  "buried-by-debt": {
    imageKey: "dark-alley",
    sceneKey: "ending-debt",
    act: [2],
  },
  "executed-by-crown": {
    imageKey: "prison-cell",
    sceneKey: "ending-execution",
    act: [4],
  },
  "betrayed-by-your-own": {
    imageKey: "secret-meeting",
    sceneKey: "ending-betrayal",
    act: [3],
  },
  "forgotten-clerk": {
    imageKey: "royal-court",
    sceneKey: "ending-forgotten",
    act: [3],
  },
  "minor-lord-ashford": {
    imageKey: "noble-feast",
    sceneKey: "ending-lord",
    act: [3],
  },
  "silent-monk": {
    imageKey: "mountain-monastery",
    sceneKey: "ending-monastery",
    act: [1],
  },
  "governor-western-gate": {
    imageKey: "border-war",
    sceneKey: "ending-walls",
    act: [3],
  },
  "regent-behind-throne": {
    imageKey: "throne-room",
    sceneKey: "ending-regent",
    act: [5],
  },
  "grand-vizier": {
    imageKey: "throne-room",
    sceneKey: "ending-vizier",
    act: [5],
  },
};

export function getEndingScene(ending: Ending): EndingSceneConfig {
  const mapped = ENDING_SCENES[ending.id];
  if (mapped) {
    return {
      ...mapped,
      imageKey: ending.imageKey ?? mapped.imageKey,
    };
  }
  return {
    imageKey: ending.imageKey,
    sceneKey: "ending-generic",
    act: [5],
  };
}
