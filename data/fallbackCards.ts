import type { StoryCardData } from "@/types/game";

/** Deck tükendiğinde devreye giren düşük etkili ara gün kartları */
export const fallbackStoryCards: StoryCardData[] = [
  {
    id: "interlude-quiet-dawn",
    title: "Sessiz Bir Sabah",
    description:
      "Şafak başkentte yavaş yükseliyor. Bir gün nefes alıp plan yapmak için.",
    effects: {},
    act: [1, 2],
    tags: ["interlude"],
    imageKey: "dark-alley",
    imagePrompt:
      "Foggy medieval city dawn, narrow streets, muted gold light, Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo",
    leftChoice: {
      label: "Dinlen",
      effects: { loyalty: 3, suspicion: -2 },
      resultText: "Dinlen. Nefesin düzenlenir; yarın için küçük bir pay birikir.",
    },
    rightChoice: {
      label: "Kulak ver",
      effects: { influence: 3, wealth: -2 },
      resultText: "Kulak ver. Sokaktan tek bir ipucu gelir; fazlası yok.",
    },
  },
  {
    id: "interlude-market-noon",
    title: "Öğle Pazarı",
    description:
      "Pazar kalabalık ama sakin. Tüccarlar fısıldıyor, muhafızlar sıkı değil.",
    effects: {},
    act: [2, 3],
    tags: ["interlude"],
    imageKey: "crowded-market",
    imagePrompt:
      "Busy medieval market at noon, stalls and shadows, Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo",
    leftChoice: {
      label: "Ticaret yap",
      effects: { wealth: 4, suspicion: 2 },
      resultText: "Ticaret yap. Az altın cebe girer; birkaç göz seni not eder.",
    },
    rightChoice: {
      label: "Uzak dur",
      effects: { suspicion: -3, influence: -1 },
      resultText: "Uzak dur. Görünmez kalırsın; bugün kimse seni aramaz.",
    },
  },
  {
    id: "interlude-rain-evening",
    title: "Yağmurlu Akşam",
    description: "Yağmur taşları yıkar. Evine dönmek ya da bir hanede beklemek.",
    effects: {},
    act: [2, 3, 4],
    tags: ["interlude"],
    imageKey: "dark-alley",
    imagePrompt:
      "Rain on cobblestone medieval alley, lantern glow, Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo",
    leftChoice: {
      label: "Handa kal",
      effects: { wealth: -3, loyalty: 4 },
      resultText: "Handa kal. Sadık bir yüz tanırsın; cüzdan hafifler.",
    },
    rightChoice: {
      label: "Sokakta yürü",
      effects: { influence: 2, suspicion: 2 },
      resultText: "Sokakta yürü. Bir dedikodu kulağına çarpar; kanıt yok.",
    },
  },
  {
    id: "interlude-court-dusk",
    title: "Saray Alacakaranlığı",
    description:
      "Saray duvarları turuncuya döner. Bugün büyük hamle yok; küçük adımlar var.",
    effects: {},
    act: [4, 5],
    tags: ["interlude"],
    imageKey: "royal-court",
    imagePrompt:
      "Palace walls at dusk, torches, dark empire mood, Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo",
    leftChoice: {
      label: "Mektup yaz",
      effects: { influence: 4, wealth: -2 },
      resultText: "Mektup yaz. Bir kapı aralanır; bedel küçük bir hediyedir.",
    },
    rightChoice: {
      label: "Gölgede kal",
      effects: { suspicion: -4, influence: -2 },
      resultText: "Gölgede kal. Kimse adını söylemez; bu bazen kazançtır.",
    },
  },
  {
    id: "interlude-throne-night",
    title: "Tahtın Gecesi",
    description:
      "Başkent uyumuyor ama sen seçebilirsin: bir adım daha ya da durmak.",
    effects: {},
    act: [5],
    tags: ["interlude"],
    imageKey: "throne-room",
    imagePrompt:
      "Imperial throne silhouette at night, candles and smoke, Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo",
    leftChoice: {
      label: "Bir hamle planla",
      effects: { influence: 3, suspicion: 3 },
      resultText: "Bir hamle planla. Harita değişmez ama niyetin netleşir.",
    },
    rightChoice: {
      label: "Sessiz kal",
      effects: { loyalty: 3, suspicion: -3 },
      resultText: "Sessiz kal. Taht seni duymaz; müttefikler seni hatırlar.",
    },
  },
];

const fallbackRegistry = new Map(
  fallbackStoryCards.map((card) => [card.id, card]),
);

export function getFallbackCardById(id: string): StoryCardData | undefined {
  return fallbackRegistry.get(id);
}
