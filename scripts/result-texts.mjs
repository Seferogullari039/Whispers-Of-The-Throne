/** Kısa, doğal Türkçe sonuç metinleri */

const EFFECT_LINES = {
  wealth: {
    up: "Cüzdanın biraz ağırlaşır.",
    down: "Altın azalır; borçlar hatırlanır.",
  },
  influence: {
    up: "Sarayda adın biraz daha duyulur.",
    down: "Kapılar sana bir süre kapalı kalır.",
  },
  suspicion: {
    up: "Gözler üzerinde toplanır.",
    down: "Bir süre görünmez kalırsın.",
  },
  loyalty: {
    up: "Sadık birkaç yüz sana yaklaşır.",
    down: "Müttefikler mesafeli durur.",
  },
};

const CARD_CONTEXT = {
  "orphan-crumbs": "Cenaze ışığı sokağı altın rengine boyar.",
  "orphan-gate": "Boş sefir koltuğu herkesin dilinde.",
  "thief-mark": "Mühür ağır; sahte mi gerçek mi belli değil.",
  "thief-patron": "Zehir söylentisi hızla yayılır.",
  "dock-signal": "Liman gökyüzü dumanla kararır.",
  "dock-manifest": "Sandığın kokusu çeliği ele verir.",
  "temple-vigil": "Tütsü ve yalan aynı havada.",
  "temple-seal": "İtiraf sayfası tehlikeli bir koz.",
  "arena-roar": "Kalabalık seni unutmaz.",
  "arena-patron": "Arena ve saray aynı oyunu oynar.",
};

function topEffectLine(effects) {
  const sorted = Object.entries(effects)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  if (!sorted.length) return "Gün biter; yarın yeni bir kart getirir.";
  const [key, value] = sorted[0];
  const lines = EFFECT_LINES[key];
  if (!lines) return "Başkentte küçük bir şey değişir.";
  return value > 0 ? lines.up : lines.down;
}

export function buildResultText(cardId, _side, label, effects) {
  const context = CARD_CONTEXT[cardId] ?? "Hikâyen bir adım ilerler.";
  const effect = topEffectLine(effects);
  return `${label}. ${effect} ${context}`;
}

export function enrichCardResults(card) {
  return {
    ...card,
    leftChoice: {
      ...card.leftChoice,
      resultText:
        card.leftChoice.resultText ??
        buildResultText(
          card.id,
          "left",
          card.leftChoice.label,
          card.leftChoice.effects,
        ),
    },
    rightChoice: {
      ...card.rightChoice,
      resultText:
        card.rightChoice.resultText ??
        buildResultText(
          card.id,
          "right",
          card.rightChoice.label,
          card.rightChoice.effects,
        ),
    },
  };
}
