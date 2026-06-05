# Kart görselleri

Görseller Cursor Agent ile üretilir; harici API gerekmez.

```
generated-prompts.json → Cursor Agent → public/card-art/*.jpg
```

Prompt kaynağı: `generated-prompts.json` / `generated-prompts.md` (`npm run export:image-prompts` ile güncellenir).

Her dosya: `{imageKey}.jpg` (ör. `orphan-crumbs.jpg`).

## Oran

Tüm oyun görselleri **portrait card art**, **9:16** oranına yakın olmalı (dikey mobil kart).

Önerilen export: **720×1280** veya **1080×1920**, JPG, orta sıkıştırma.

## Görsel tarz (Reigns benzeri)

- Stylized 2D dark fantasy
- Painterly vector illustration
- Simplified shapes
- Mobile card game artwork
- Friendly dark fantasy
- Warm readable colors
- Portrait illustration
- **No photorealism**, no realism, no 3D render
- **No text**, no logo

Yeni üretilen tüm görseller bu tarza uymalı. Mevcut fotoğrafik görseller geçici kullanılabilir; yenileri yukarıdaki stile göre değiştirilmeli.

`data/cards.ts` içindeki `imagePrompt` alanları bu stili içerir.

## Köken görselleri

- `orphan-origin.jpg`
- `thief-origin.jpg`
- `dock-worker-origin.jpg`
- `temple-origin.jpg`
- `arena-origin.jpg`

## Olay görselleri

- `arena-fight.jpg`
- `assassin-offer.jpg`
- `border-war.jpg`
- `burning-harbor.jpg`
- `city-fire.jpg`
- `crowded-market.jpg`
- `dark-alley.jpg`
- `desert-caravan.jpg`
- `hidden-ledger.jpg`
- `market-riot.jpg`
- `merchant-guild.jpg`
- `noble-feast.jpg`
- `plague-street.jpg`
- `prison-cell.jpg`
- `royal-court.jpg`
- `royal-inspection.jpg`
- `secret-meeting.jpg`
- `smugglers-dock.jpg`
- `temple-secret.jpg`
- `throne-room.jpg`

## Ending görselleri (önerilen)

Ending ekranları `Ending.imageKey` veya `lib/endingScene.ts` eşlemesini kullanır. Özel placeholder yoksa yukarıdaki anahtarlar paylaşılabilir.

Dosya yoksa `EndingSceneArt` placeholder gösterilir.
