import type { Origin } from "@/types/game";

export const origins: Origin[] = [
  {
    id: "orphan",
    imageKey: "orphan-origin",
    sceneDescription:
      "Young orphan in a rainy medieval alley with warm lantern light",
    name: "Yetim",
    title: "Kül Yokuşunun Çocuğu",
    description:
      "Kanalizasyon çıkmazlarında büyüdün. Soyun yok; sadece boş sefir koltuğu ve tırmanma arzusu var.",
    startingSkillEffects: {
      wealth: -10,
      influence: -6,
      suspicion: 6,
      loyalty: -3,
    },
    introCardIds: ["orphan-crumbs", "orphan-gate"],
  },
  {
    id: "thief",
    imageKey: "thief-origin",
    sceneDescription:
      "Masked thief on a rooftop above a wealthy city at moonlit night",
    name: "Hırsız",
    title: "Yaldızlı Çarşının Gölgesi",
    description:
      "Kilit ve defter senin işin. Yeraltı seni tanır; saray henüz tanımıyor.",
    startingSkillEffects: {
      wealth: -4,
      influence: 4,
      suspicion: 8,
      loyalty: -6,
    },
    introCardIds: ["thief-mark", "thief-patron"],
  },
  {
    id: "dock-worker",
    imageKey: "dock-worker-origin",
    sceneDescription:
      "Harbor worker carrying ropes beside giant merchant ships at foggy dawn",
    name: "Liman İşçisi",
    title: "Ellerinde Tuz",
    description:
      "Rıhtımda büyüdün. Yük gemileri ve gizli sandıklar senin okulun.",
    startingSkillEffects: {
      wealth: -6,
      influence: -4,
      suspicion: -3,
      loyalty: 8,
    },
    introCardIds: ["dock-signal", "dock-manifest"],
  },
  {
    id: "temple-acolyte",
    imageKey: "temple-origin",
    sceneDescription:
      "Young temple acolyte in a candlelit sanctuary among mysterious relics",
    name: "Tapınak Çırağı",
    title: "Tütsünün Ardında Ses",
    description:
      "Tapınakta itiraf dinledin. Sabır ve gizli bilgi senin silahın.",
    startingSkillEffects: {
      wealth: -8,
      influence: 5,
      suspicion: -8,
      loyalty: 10,
    },
    introCardIds: ["temple-vigil", "temple-seal"],
  },
  {
    id: "arena-fighter",
    imageKey: "arena-origin",
    sceneDescription:
      "Arena fighter in blood-stained sand before a roaring colosseum crowd",
    name: "Arena Dövüşçüsü",
    title: "Kalabalık İçin Kan",
    description:
      "Arena seni ünlü etti. Kalabalık seni sever; saray henüz görmezden geliyor.",
    startingSkillEffects: {
      wealth: -6,
      influence: 8,
      suspicion: 5,
      loyalty: 3,
    },
    introCardIds: ["arena-roar", "arena-patron"],
  },
];

export function getOriginById(id: string): Origin | undefined {
  return origins.find((origin) => origin.id === id);
}
