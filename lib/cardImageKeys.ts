import imageKeyData from "@/data/card-image-keys.json";

const cardKeys = imageKeyData.cards as Record<string, string>;
const originKeys = imageKeyData.origins as Record<string, string>;

export function getCardImageKey(cardId: string): string | undefined {
  return cardKeys[cardId];
}

export function getOriginImageKey(originId: string): string | undefined {
  return originKeys[originId];
}

/** Tüm benzersiz kart görsel dosya adları (imageKey.jpg) */
export function getAllCardArtKeys(): string[] {
  const keys = new Set<string>([
    ...Object.values(cardKeys),
    ...Object.values(originKeys),
  ]);
  return [...keys].sort();
}
