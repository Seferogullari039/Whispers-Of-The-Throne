"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardArtScene } from "@/components/CardArtScene";
import { CARD_PORTRAIT_ART_CLASS } from "@/lib/cardArtLayout";
import { playSwipeConfirmSound } from "@/lib/audio";
import {
  hasSeenSwipeTutorial,
  markSwipeTutorialSeen,
} from "@/lib/swipeTutorial";
import type { StoryCardData } from "@/types/game";

const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 140;
const ROTATION_FACTOR = 0.045;
const EXIT_OFFSET = 300;
const EXIT_DURATION_MS = 220;
const AXIS_LOCK_PX = 8;
const TUTORIAL_PEEK = 52;

type StoryCardProps = {
  card: StoryCardData;
  onChooseLeft: () => void;
  onChooseRight: () => void;
  disabled?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function StoryCard({
  card,
  onChooseLeft,
  onChooseRight,
  disabled = false,
}: StoryCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialOffset, setTutorialOffset] = useState(0);

  const dragSurfaceRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const axisLock = useRef<"x" | "y" | null>(null);
  const activePointerId = useRef<number | null>(null);
  const thresholdSoundPlayed = useRef(false);

  useEffect(() => {
    setOffsetX(0);
    setIsDragging(false);
    setIsAnimatingOut(false);
    axisLock.current = null;
    activePointerId.current = null;
    thresholdSoundPlayed.current = false;
  }, [card.id]);

  useEffect(() => {
    if (disabled || hasSeenSwipeTutorial()) return;

    setTutorialActive(true);
    const timers: number[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    schedule(() => setTutorialOffset(-TUTORIAL_PEEK), 350);
    schedule(() => setTutorialOffset(0), 750);
    schedule(() => setTutorialOffset(TUTORIAL_PEEK), 1150);
    schedule(() => setTutorialOffset(0), 1550);
    schedule(() => {
      markSwipeTutorialSeen();
      setTutorialActive(false);
      setTutorialOffset(0);
    }, 2000);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [disabled]);

  const commitChoice = useCallback(
    (side: "left" | "right") => {
      if (disabled || isAnimatingOut || tutorialActive) return;

      const exitX = side === "right" ? EXIT_OFFSET : -EXIT_OFFSET;
      setIsAnimatingOut(true);
      setIsDragging(false);
      setOffsetX(exitX);

      window.setTimeout(() => {
        if (side === "left") onChooseLeft();
        else onChooseRight();
      }, EXIT_DURATION_MS);
    },
    [disabled, isAnimatingOut, tutorialActive, onChooseLeft, onChooseRight],
  );

  const snapBack = useCallback(() => {
    setIsDragging(false);
    setOffsetX(0);
    thresholdSoundPlayed.current = false;
    axisLock.current = null;
    activePointerId.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || isAnimatingOut || tutorialActive) return;
      if (event.button !== 0) return;

      activePointerId.current = event.pointerId;
      pointerStartX.current = event.clientX;
      pointerStartY.current = event.clientY;
      axisLock.current = null;
      thresholdSoundPlayed.current = false;
      setIsDragging(true);

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [disabled, isAnimatingOut, tutorialActive],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        activePointerId.current === null ||
        event.pointerId !== activePointerId.current ||
        tutorialActive
      ) {
        return;
      }

      const deltaX = event.clientX - pointerStartX.current;
      const deltaY = event.clientY - pointerStartY.current;

      if (!axisLock.current) {
        if (
          Math.abs(deltaX) < AXIS_LOCK_PX &&
          Math.abs(deltaY) < AXIS_LOCK_PX
        ) {
          return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          axisLock.current = "x";
        } else {
          axisLock.current = "y";
          snapBack();
          return;
        }
      }

      if (axisLock.current !== "x") return;

      event.preventDefault();
      const clamped = clamp(deltaX, -MAX_DRAG, MAX_DRAG);
      setOffsetX(clamped);

      if (
        Math.abs(clamped) >= SWIPE_THRESHOLD &&
        !thresholdSoundPlayed.current
      ) {
        thresholdSoundPlayed.current = true;
        playSwipeConfirmSound();
      }
    },
    [snapBack, tutorialActive],
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        activePointerId.current === null ||
        event.pointerId !== activePointerId.current ||
        tutorialActive
      ) {
        return;
      }

      if (dragSurfaceRef.current?.hasPointerCapture(event.pointerId)) {
        dragSurfaceRef.current.releasePointerCapture(event.pointerId);
      }

      const releaseOffset =
        axisLock.current === "x"
          ? clamp(event.clientX - pointerStartX.current, -MAX_DRAG, MAX_DRAG)
          : 0;

      if (releaseOffset >= SWIPE_THRESHOLD) {
        commitChoice("right");
        return;
      }

      if (releaseOffset <= -SWIPE_THRESHOLD) {
        commitChoice("left");
        return;
      }

      snapBack();
    },
    [commitChoice, snapBack, tutorialActive],
  );

  const displayOffset = tutorialActive ? tutorialOffset : offsetX;
  const dragProgress = clamp(Math.abs(displayOffset) / SWIPE_THRESHOLD, 0, 1);
  const highlightLeft = displayOffset < -AXIS_LOCK_PX || tutorialOffset < 0;
  const highlightRight = displayOffset > AXIS_LOCK_PX || tutorialOffset > 0;
  const readyLeft = displayOffset <= -SWIPE_THRESHOLD;
  const readyRight = displayOffset >= SWIPE_THRESHOLD;
  const transform = `translate3d(${displayOffset}px, 0, 0) rotate(${displayOffset * ROTATION_FACTOR}deg)`;
  const transitionClass = tutorialActive
    ? "transition-[transform] duration-300 ease-in-out"
    : isDragging || isAnimatingOut
      ? isAnimatingOut
        ? "transition-[transform,opacity] duration-200 ease-out"
        : ""
      : "transition-transform duration-200 ease-out";

  const trailOpacity =
    isDragging || tutorialActive ? 0.2 + dragProgress * 0.35 : 0;

  return (
    <div className="game-panel mx-auto flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        {highlightRight && (
          <div
            className="swipe-trail swipe-trail-right pointer-events-none absolute inset-y-0 right-0 z-[1] w-[48%] rounded-l-full"
            style={{ opacity: trailOpacity }}
          />
        )}
        {highlightLeft && (
          <div
            className="swipe-trail swipe-trail-left pointer-events-none absolute inset-y-0 left-0 z-[1] w-[48%] rounded-r-full"
            style={{ opacity: trailOpacity }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 z-[2] rounded-2xl transition-opacity duration-150"
          style={{
            opacity: highlightRight ? 0.35 + dragProgress * 0.45 : 0,
            background:
              "radial-gradient(ellipse at 85% 45%, rgba(217,160,50,0.45), transparent 68%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] rounded-2xl transition-opacity duration-150"
          style={{
            opacity: highlightLeft ? 0.35 + dragProgress * 0.45 : 0,
            background:
              "radial-gradient(ellipse at 15% 45%, rgba(140,90,50,0.4), transparent 68%)",
            filter: "blur(20px)",
          }}
        />

        <div
          ref={dragSurfaceRef}
          className={`story-card-drag relative z-10 flex h-full min-h-0 flex-1 flex-col will-change-transform ${transitionClass} ${
            readyLeft || readyRight ? "scale-[1.015]" : ""
          }`}
          style={{
            transform,
            opacity: isAnimatingOut ? 0.35 : 1,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <article className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-950/50 to-black/60 shadow-lg shadow-black/40">
            <CardArtScene
              imageKey={card.imageKey}
              imagePrompt={card.imagePrompt}
              act={card.act}
              tags={card.tags}
              aspectClass={CARD_PORTRAIT_ART_CLASS}
              className="pointer-events-none shrink-0 select-none rounded-none border-0 border-b border-amber-800/30"
            />

            {tutorialActive && (
              <div className="swipe-tutorial-hint pointer-events-none absolute inset-x-0 top-[36%] z-30 flex items-center justify-between gap-3 px-5">
                <p className="max-w-[42%] text-left text-xs font-semibold leading-snug text-amber-100/92 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  ← {card.leftChoice.label}
                </p>
                <p className="max-w-[42%] text-right text-xs font-semibold leading-snug text-amber-100/92 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {card.rightChoice.label} →
                </p>
              </div>
            )}

            {!tutorialActive && highlightLeft && (
              <div
                className={`story-choice-overlay story-choice-left pointer-events-none absolute inset-x-0 top-[32%] z-20 flex justify-center px-4 transition-all duration-150 ${
                  readyLeft ? "story-choice-ready" : ""
                }`}
              >
                <p className="max-w-[90%] text-center text-sm font-semibold leading-snug text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  ← {card.leftChoice.label}
                </p>
              </div>
            )}

            {!tutorialActive && highlightRight && (
              <div
                className={`story-choice-overlay story-choice-right pointer-events-none absolute inset-x-0 top-[32%] z-20 flex justify-center px-4 transition-all duration-150 ${
                  readyRight ? "story-choice-ready" : ""
                }`}
              >
                <p className="max-w-[90%] text-center text-sm font-semibold leading-snug text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  {card.rightChoice.label} →
                </p>
              </div>
            )}

            <div className="flex max-h-[28%] min-h-[4.25rem] shrink-0 flex-col p-3 pt-2">
              <h2 className="mb-1 shrink-0 text-[15px] font-semibold leading-tight text-amber-50">
                {card.title}
              </h2>

              <p className="min-h-0 flex-1 overflow-y-auto overscroll-contain text-[14px] leading-relaxed text-amber-100/88 [-webkit-overflow-scrolling:touch]">
                {card.description}
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
