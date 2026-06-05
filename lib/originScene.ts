import type { Origin } from "@/types/game";

export type OriginSceneConfig = {
  act: number[];
  sceneKey: string;
};

export const ORIGIN_SCENES: Record<string, OriginSceneConfig> = {
  orphan: { act: [1], sceneKey: "orphan" },
  thief: { act: [1, 2], sceneKey: "thief" },
  "dock-worker": { act: [2], sceneKey: "dock-worker" },
  "temple-acolyte": { act: [1], sceneKey: "temple-acolyte" },
  "arena-fighter": { act: [1], sceneKey: "arena-fighter" },
};

export function getOriginScene(origin: Origin): OriginSceneConfig {
  return (
    ORIGIN_SCENES[origin.id] ?? {
      act: [1],
      sceneKey: origin.id,
    }
  );
}
