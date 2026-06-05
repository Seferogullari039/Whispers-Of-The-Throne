This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Kart görselleri

Görseller **Cursor Agent** tarafından üretilir. Harici API veya API anahtarı gerekmez.

Akış:

```
generated-prompts.json
        ↓
  Cursor Agent
        ↓
public/card-art/*.jpg
```

Prompt dosyalarını güncellemek için:

```bash
npm run export:image-prompts
```

Bu komut `public/card-art/generated-prompts.json` ve `generated-prompts.md` dosyalarını yeniler. Üretilen JPG dosyalarını `filename` alanındaki isimle `public/card-art/` klasörüne kaydedin.

## Ambient müzik

Geliştirmede kaynak olarak **procedural WAV** üretilir; web alpha / deploy için **OGG (Vorbis)** kullanılır. Oyun önce `.ogg` dener, yoksa `.wav` fallback.

```bash
# Kaynak loop'ları üret (~55 MB WAV, development)
npm run generate:audio

# Web için OGG'ye dönüştür (~1–2 MB / parça, ffmpeg gerekir)
npm run optimize:audio
```

`optimize:audio` için [ffmpeg](https://ffmpeg.org/) PATH'te olmalı veya `npm install --save-dev ffmpeg-static` ile proje içi binary kullanılabilir. ffmpeg yoksa script uyarı verir ve build'i bozmaz; oyun WAV fallback ile çalışır.

Dosyalar: `public/audio/*.ogg` (web), `public/audio/*.wav` (development / fallback).

**Vercel deploy:** `.vercelignore` excludes `public/audio/*.wav` (~55 MB). OGG dosyaları deploy edilir; localde WAV fallback çalışmaya devam eder.

**Müzik test (development):** Sol altta `MusicDebugHud` — aktif track, Müzik/SFX durumu, master volume.

```text
Hero → Ayarlar → Müzik Aç     → menu-theme.ogg
Yeni Oyun → Origin/Playing    → act-1-ashes.ogg (crossfade)
DevPanel → +Seviye            → act değişince crossfade
Müzik Kapat                   → durur
Ses Efektleri Kapat           → swipe/result SFX yok (müzik ayrı)
```

Master müzik sesi varsayılan **0.45** (`musicVolume` in localStorage, Settings slider için hazır).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
