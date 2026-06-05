"use client";

import { useEffect, useState } from "react";
import { CardSceneArt } from "@/components/CardSceneArt";
import { EndingSceneArt } from "@/components/EndingSceneArt";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import { getCardArtPath, resolveActTone } from "@/lib/cardArt";

type CardArtSceneProps = {
  imageKey?: string;
  imagePrompt?: string;
  act?: number[];
  tags?: string[];
  sceneKey?: string;
  label?: string;
  className?: string;
  aspectClass?: string;
  showDevPrompt?: boolean;
  compact?: boolean;
  heroBackdrop?: boolean;
};

export function CardArtScene({
  imageKey,
  imagePrompt,
  act,
  tags: _tags,
  sceneKey,
  label,
  className = "",
  aspectClass = CARD_PORTRAIT_ART_CLASS,
  showDevPrompt = false,
  compact = false,
  heroBackdrop = false,
}: CardArtSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgVisible, setImgVisible] = useState(false);

  const artPath = getCardArtPath(imageKey);
  const showImage = Boolean(artPath && !imgFailed);
  const actPrimary = act?.[0] ?? 1;
  const tone = resolveActTone(act);
  const resolvedScene = sceneKey ?? `act-${actPrimary}`;
  const isEndingScene = resolvedScene.startsWith("ending-");

  useEffect(() => {
    setImgFailed(false);
    setImgVisible(false);
  }, [imageKey, artPath]);

  return (
    <div
      className={`card-art-scene relative w-full overflow-hidden ${aspectClass} ${className}`}
      data-act={actPrimary}
      data-scene={resolvedScene}
      data-image-key={imageKey || undefined}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-b ${tone.gradient}`}
      />

      <div
        className={`card-art-placeholder absolute inset-0 z-[1] transition-opacity duration-500 ease-out ${
          showImage && imgVisible ? "opacity-0" : "opacity-100"
        }`}
      >
        {isEndingScene ? (
          <EndingSceneArt sceneKey={resolvedScene} />
        ) : (
          <CardSceneArt act={actPrimary} sceneKey={resolvedScene} />
        )}
      </div>

      {showImage && artPath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={artPath}
          src={artPath}
          alt=""
          className={`card-art-photo pointer-events-none absolute inset-0 z-[2] h-full w-full select-none object-cover object-[center_20%] transition-opacity duration-500 ease-out ${
            imgVisible ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImgVisible(true)}
          onError={() => {
            setImgFailed(true);
            setImgVisible(false);
          }}
        />
      )}

      <div className="card-art-fog pointer-events-none absolute inset-0 z-[3]" />
      <div className="card-art-noise pointer-events-none absolute inset-0 z-[3] opacity-[0.12]" />
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background: `radial-gradient(ellipse at 50% 12%, ${tone.glow}, transparent 50%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.55), transparent 42%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 20%, ${tone.vignette} 100%)`,
        }}
      />
      <div className="card-art-gleam pointer-events-none absolute inset-0 z-[3]" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t to-transparent ${
          heroBackdrop
            ? "hero-art-bottom-fade h-[38%] from-black/55 via-black/20"
            : "h-[50%] from-black/92 via-black/40"
        }`}
      />

      {label && !compact && (
        <span className="absolute left-3 top-2.5 z-[5] text-[8px] font-semibold uppercase tracking-[0.22em] text-amber-200/35">
          {label}
        </span>
      )}

      {showDevPrompt && imagePrompt && (
        <p
          className="pointer-events-none absolute right-1 bottom-0 left-1 z-[5] truncate text-[5px] leading-none text-amber-200/15"
          title={imagePrompt}
        >
          {imagePrompt}
        </p>
      )}
    </div>
  );
}
