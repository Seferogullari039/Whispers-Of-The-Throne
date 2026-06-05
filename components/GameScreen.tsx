"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyEffects,
  applyFlagChanges,
  buildDeckForOrigin,
  createInitialFlags,
  createSkillsFromOrigin,
  getChoiceEffects,
  markCardSeen,
  pickNextCard,
  pickRandomOrigin,
} from "@/lib/gameLogic";
import {
  detectEndingTrigger,
  incrementLevel,
  resolveEnding,
} from "@/lib/endingLogic";
import { getActInfo } from "@/lib/acts";
import {
  initAudio,
  isMusicEnabled,
  startAmbientMusic,
  playEndingSound,
  playResultSound,
  unlockAudio,
} from "@/lib/audio";
import { getSkillFlashes, type SkillFlashes } from "@/lib/skillFlash";
import { getRankTitle } from "@/lib/ranks";
import {
  clearGameState,
  getSavedGamePreview,
  hasSavedGame,
  loadGameState,
  saveGameState,
} from "@/lib/saveGame";
import { getSkillEffectFeedbacks } from "@/lib/skillDeltas";
import type { PendingResultState } from "@/lib/saveGame";
import type {
  Ending,
  GameFlags,
  GamePhase,
  Origin,
  PlayerLevel,
  Skills,
  StoryCardData,
} from "@/types/game";
import { INITIAL_PLAYER_LEVEL, MAX_PLAYER_LEVEL } from "@/types/game";
import { isVibrationEnabled } from "@/lib/gameSettings";
import { SettingsGearButton, SettingsMenu } from "@/components/SettingsMenu";
import { DevPanel } from "@/components/DevPanel";
import { EndingScreen } from "@/components/EndingScreen";
import { OriginIntroScreen } from "@/components/OriginIntroScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { SkillOrbs } from "@/components/SkillOrbs";
import { HeroScreen } from "@/components/HeroScreen";
import { StoryCard } from "@/components/StoryCard";

type GameSession = {
  origin: Origin;
  deck: StoryCardData[];
  skills: Skills;
};

type PendingResult = PendingResultState;

function createGameSession(): GameSession {
  const origin = pickRandomOrigin();
  return {
    origin,
    deck: buildDeckForOrigin(origin),
    skills: createSkillsFromOrigin(origin),
  };
}

function createFreshRunState() {
  const session = createGameSession();
  return {
    session,
    phase: "origin_intro" as GamePhase,
    currentCard: null as StoryCardData | null,
    introQueue: [] as string[],
    flags: createInitialFlags(),
    seenCardIds: new Set<string>(),
    playerLevel: INITIAL_PLAYER_LEVEL,
    turnsPlayed: 0,
    activeEnding: null as Ending | null,
    pendingResult: null as PendingResult | null,
  };
}

export function GameScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [savePreview, setSavePreview] = useState<ReturnType<
    typeof getSavedGamePreview
  >>(null);
  const [session, setSession] = useState<GameSession>(createGameSession);
  const [phase, setPhase] = useState<GamePhase>("hero");
  const [currentCard, setCurrentCard] = useState<StoryCardData | null>(null);
  const [introQueue, setIntroQueue] = useState<string[]>([]);
  const [flags, setFlags] = useState<GameFlags>(createInitialFlags);
  const [seenCardIds, setSeenCardIds] = useState<Set<string>>(() => new Set());
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>(INITIAL_PLAYER_LEVEL);
  const [turnsPlayed, setTurnsPlayed] = useState(0);
  const [activeEnding, setActiveEnding] = useState<Ending | null>(null);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const { origin, deck, skills } = session;

  const isHero = phase === "hero";
  const isEnding = phase === "ending" && activeEnding !== null;
  const isResult = phase === "result" && pendingResult !== null;
  const showSkillBar =
    !isHero &&
    phase !== "origin_intro" &&
    (phase === "playing" || isResult || isEnding);
  const rankTitle = useMemo(() => getRankTitle(playerLevel), [playerLevel]);
  const actInfo = useMemo(() => getActInfo(playerLevel), [playerLevel]);
  const [devTestNote, setDevTestNote] = useState<string | null>(null);
  const [skillFlashes, setSkillFlashes] = useState<SkillFlashes>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  const persistGame = useCallback(
    (overrides?: {
      phase?: GamePhase;
      currentCard?: StoryCardData | null;
      pendingResult?: PendingResult | null;
      activeEnding?: Ending | null;
      introQueue?: string[];
      skills?: Skills;
      flags?: GameFlags;
      seenCardIds?: Set<string>;
      playerLevel?: PlayerLevel;
      turnsPlayed?: number;
      session?: GameSession;
    }) => {
      const savePhase = overrides?.phase ?? phase;
      const saveSession = overrides?.session ?? session;

      saveGameState({
        skills: overrides?.skills ?? saveSession.skills,
        playerLevel: overrides?.playerLevel ?? playerLevel,
        flags: overrides?.flags ?? flags,
        seenCardIds: overrides?.seenCardIds ?? seenCardIds,
        currentCard:
          overrides?.currentCard !== undefined
            ? overrides.currentCard
            : currentCard,
        origin: saveSession.origin,
        deck: saveSession.deck,
        gamePhase: savePhase,
        introQueue: overrides?.introQueue ?? introQueue,
        turnsPlayed: overrides?.turnsPlayed ?? turnsPlayed,
        pendingResult:
          overrides?.pendingResult !== undefined
            ? overrides.pendingResult
            : pendingResult,
        activeEnding:
          overrides?.activeEnding !== undefined
            ? overrides.activeEnding
            : activeEnding,
      });
    },
    [
      activeEnding,
      currentCard,
      flags,
      introQueue,
      pendingResult,
      phase,
      playerLevel,
      seenCardIds,
      session,
      turnsPlayed,
    ],
  );

  const applyDevSkillEnding = useCallback(
    (nextSkills: Skills) => {
      const trigger = detectEndingTrigger(nextSkills, playerLevel);
      if (!trigger) {
        setSession((prev) => ({ ...prev, skills: nextSkills }));
        persistGame({
          skills: nextSkills,
          session: { ...session, skills: nextSkills },
        });
        return;
      }

      const ending = resolveEnding(trigger, playerLevel, flags);
      const nextPending: PendingResult = {
        choiceLabel: "[Dev] Kader müdahale ediyor",
        resultText:
          "Saray yeniden hareket etmeden önce tepki veriyor. Gücün bir sınırı aştı.",
        skillFeedbacks: getSkillEffectFeedbacks(skills, nextSkills),
        pendingEnding: ending,
        nextCard: null,
        introQueueAfter: introQueue,
      };

      setSession((prev) => ({ ...prev, skills: nextSkills }));
      setPendingResult(nextPending);
      setPhase("result");
      setIsResolving(false);

      persistGame({
        phase: "result",
        skills: nextSkills,
        pendingResult: nextPending,
        session: { ...session, skills: nextSkills },
      });
    },
    [flags, introQueue, persistGame, playerLevel, session, skills],
  );

  const devActions = useMemo(
    () => ({
      onAddLevel: () => {
        const nextLevel = Math.min(playerLevel + 10, MAX_PLAYER_LEVEL);
        setPlayerLevel(nextLevel);

        const trigger = detectEndingTrigger(skills, nextLevel);
        if (trigger) {
          const ending = resolveEnding(trigger, nextLevel, flags);
          const capPending: PendingResult = {
            choiceLabel: "[Dev] Seviye tavanı",
            resultText: "Gücün zirvesine tırmandın.",
            skillFeedbacks: [],
            pendingEnding: ending,
            nextCard: null,
            introQueueAfter: introQueue,
          };
          setPendingResult(capPending);
          setPhase("result");
          setCurrentCard(null);
          persistGame({
            phase: "result",
            playerLevel: nextLevel,
            pendingResult: capPending,
            currentCard: null,
          });
          return;
        }

        persistGame({ playerLevel: nextLevel });
      },
      onSetSkillsTo50: () => {
        const nextSkills: Skills = {
          wealth: 50,
          influence: 50,
          suspicion: 50,
          loyalty: 50,
        };
        setSession((prev) => ({ ...prev, skills: nextSkills }));
        persistGame({
          skills: nextSkills,
          session: { ...session, skills: nextSkills },
        });
      },
      onTriggerWealthLow: () => {
        applyDevSkillEnding({ ...skills, wealth: 0 });
      },
      onTriggerSuspicionHigh: () => {
        applyDevSkillEnding({ ...skills, suspicion: 100 });
      },
      onClearSave: () => {
        clearGameState();
        setSavePreview(null);
      },
      onForceRandomNextCard: () => {
        if (phase !== "playing" && phase !== "result") return;

        const next = pickNextCard(
          deck,
          flags,
          seenCardIds,
          introQueue,
          playerLevel,
          currentCard?.id,
        );

        setPendingResult(null);
        setPhase("playing");
        setCurrentCard(next);
        setIsResolving(false);

        persistGame({
          phase: "playing",
          currentCard: next,
          pendingResult: null,
        });
      },
    }),
    [
      applyDevSkillEnding,
      currentCard?.id,
      deck,
      flags,
      introQueue,
      persistGame,
      phase,
      playerLevel,
      seenCardIds,
      session,
      skills,
    ],
  );

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    if (!showSkillBar || !isMusicEnabled()) return;
    void startAmbientMusic(actInfo.act);
  }, [actInfo.act, phase, showSkillBar]);

  useEffect(() => {
    if (Object.keys(skillFlashes).length === 0) return;
    const timer = window.setTimeout(() => setSkillFlashes({}), 900);
    return () => window.clearTimeout(timer);
  }, [skillFlashes]);

  useEffect(() => {
    if (hasSavedGame()) {
      const preview = getSavedGamePreview();
      if (preview) {
        setSavePreview(preview);
      } else {
        clearGameState();
      }
    }
    setPhase("hero");
    setHydrated(true);
  }, []);

  const handleContinueSaved = useCallback(() => {
    const loaded = loadGameState();
    if (!loaded) {
      clearGameState();
      setPhase("hero");
      setSavePreview(null);
      return;
    }

    setSession(loaded.session);
    setPhase(loaded.phase);
    setCurrentCard(loaded.currentCard);
    setIntroQueue(loaded.introQueue);
    setFlags(loaded.flags);
    setSeenCardIds(loaded.seenCardIds);
    setPlayerLevel(loaded.playerLevel);
    setTurnsPlayed(loaded.turnsPlayed);
    setActiveEnding(loaded.activeEnding);
    setPendingResult(loaded.pendingResult);
    setSavePreview(null);
    setIsResolving(false);
  }, []);

  const handleNewGame = useCallback(() => {
    clearGameState();
    const fresh = createFreshRunState();
    setSession(fresh.session);
    setPhase(fresh.phase);
    setCurrentCard(fresh.currentCard);
    setIntroQueue(fresh.introQueue);
    setFlags(fresh.flags);
    setSeenCardIds(fresh.seenCardIds);
    setPlayerLevel(fresh.playerLevel);
    setTurnsPlayed(fresh.turnsPlayed);
    setActiveEnding(fresh.activeEnding);
    setPendingResult(fresh.pendingResult);
    setSavePreview(null);
    setIsResolving(false);
  }, []);

  const handleBegin = useCallback(() => {
    const queue = [...session.origin.introCardIds];
    setIntroQueue(queue);
    setPhase("playing");

    const first = pickNextCard(
      session.deck,
      flags,
      seenCardIds,
      queue,
      INITIAL_PLAYER_LEVEL,
    );

    setCurrentCard(first);
    persistGame({
      phase: "playing",
      currentCard: first,
      introQueue: queue,
    });
  }, [flags, persistGame, seenCardIds, session.deck, session.origin.introCardIds]);

  const handleChoice = useCallback(
    (side: "left" | "right") => {
      if (
        phase !== "playing" ||
        !currentCard ||
        isEnding ||
        isResolving ||
        pendingResult ||
        settingsOpen
      ) {
        return;
      }

      setIsResolving(true);
      if (
        isVibrationEnabled() &&
        typeof navigator !== "undefined" &&
        navigator.vibrate
      ) {
        navigator.vibrate(20);
      }
      void unlockAudio();

      const choice =
        side === "left" ? currentCard.leftChoice : currentCard.rightChoice;
      const effects = getChoiceEffects(currentCard, side);
      const prevSkills = skills;
      const nextSkills = applyEffects(skills, effects);
      const nextFlags = applyFlagChanges(flags, currentCard, side);
      const nextLevel = incrementLevel(playerLevel);
      const playedCard = currentCard;
      const nextSeen = markCardSeen(seenCardIds, playedCard);
      const skillFeedbacks = getSkillEffectFeedbacks(prevSkills, nextSkills);
      setSkillFlashes(getSkillFlashes(prevSkills, nextSkills));
      const nextTurns = turnsPlayed + 1;

      const nextSession = { ...session, skills: nextSkills };

      let introQueueAfter = [...introQueue];
      if (introQueueAfter[0] === playedCard.id) {
        introQueueAfter = introQueueAfter.slice(1);
      }

      const endingTrigger = detectEndingTrigger(nextSkills, nextLevel);
      let pendingEnding: Ending | null = null;
      let nextCard: StoryCardData | null = null;

      if (endingTrigger) {
        pendingEnding = resolveEnding(endingTrigger, nextLevel, nextFlags);
      } else {
        nextCard = pickNextCard(
          deck,
          nextFlags,
          nextSeen,
          introQueueAfter,
          nextLevel,
          playedCard.id,
        );
      }

      if (isDev && nextTurns > 0 && nextTurns % 10 === 0) {
        setDevTestNote(
          "Test Notu: Bu noktada kart tekrarını, skill dengesini ve hikâye akışını kontrol et.",
        );
      }

      const resultText =
        choice.resultText ??
        "Başkent kayıyor; hikâyen daha da sıkıyor.";

      const nextPending: PendingResult = {
        choiceLabel: choice.label,
        resultText,
        skillFeedbacks,
        resultImageKey:
          choice.resultImageKey ?? playedCard.imageKey,
        resultImagePrompt:
          choice.resultImagePrompt ?? playedCard.imagePrompt,
        resultAct: playedCard.act,
        resultTags: playedCard.tags,
        pendingEnding,
        nextCard,
        introQueueAfter,
      };

      setSession(nextSession);
      setFlags(nextFlags);
      setSeenCardIds(nextSeen);
      setPlayerLevel(nextLevel);
      setTurnsPlayed(nextTurns);
      setPendingResult(nextPending);
      setPhase("result");
      setIsResolving(false);
      playResultSound();

      persistGame({
        phase: "result",
        skills: nextSkills,
        flags: nextFlags,
        seenCardIds: nextSeen,
        playerLevel: nextLevel,
        turnsPlayed: nextTurns,
        pendingResult: nextPending,
        introQueue: introQueueAfter,
        session: nextSession,
      });
    },
    [
      currentCard,
      deck,
      flags,
      introQueue,
      isDev,
      isEnding,
      isResolving,
      pendingResult,
      persistGame,
      phase,
      playerLevel,
      seenCardIds,
      session,
      settingsOpen,
      skills,
      turnsPlayed,
    ],
  );

  const handleContinueResult = useCallback(() => {
    if (!pendingResult) return;

    if (pendingResult.pendingEnding) {
      const ending = pendingResult.pendingEnding;
      setActiveEnding(ending);
      setPhase("ending");
      setCurrentCard(null);
      setPendingResult(null);
      playEndingSound();
      clearGameState();
      return;
    }

    setIntroQueue(pendingResult.introQueueAfter);
    setCurrentCard(pendingResult.nextCard);
    setPhase("playing");
    setPendingResult(null);

    persistGame({
      phase: "playing",
      currentCard: pendingResult.nextCard,
      introQueue: pendingResult.introQueueAfter,
      pendingResult: null,
    });
  }, [pendingResult, persistGame]);

  const handleRestart = useCallback(() => {
    clearGameState();
    const fresh = createFreshRunState();
    setSession(fresh.session);
    setPhase(fresh.phase);
    setCurrentCard(fresh.currentCard);
    setIntroQueue(fresh.introQueue);
    setFlags(fresh.flags);
    setSeenCardIds(fresh.seenCardIds);
    setPlayerLevel(fresh.playerLevel);
    setTurnsPlayed(fresh.turnsPlayed);
    setActiveEnding(fresh.activeEnding);
    setPendingResult(fresh.pendingResult);
    setIsResolving(false);
    setSkillFlashes({});
  }, []);

  const handleSettingsClearSave = useCallback(() => {
    clearGameState();
    setSavePreview(null);
    const fresh = createFreshRunState();
    setSession(fresh.session);
    setCurrentCard(fresh.currentCard);
    setIntroQueue(fresh.introQueue);
    setFlags(fresh.flags);
    setSeenCardIds(fresh.seenCardIds);
    setPlayerLevel(fresh.playerLevel);
    setTurnsPlayed(fresh.turnsPlayed);
    setActiveEnding(fresh.activeEnding);
    setPendingResult(fresh.pendingResult);
    setIsResolving(false);
    setSkillFlashes({});
    setPhase("hero");
  }, []);

  const handleSettingsReturnToMainMenu = useCallback(() => {
    if (phase === "ending") {
      handleRestart();
      return;
    }
    if (phase !== "origin_intro" && phase !== "hero") {
      persistGame();
      const preview = getSavedGamePreview();
      if (preview) {
        setSavePreview(preview);
      }
    }
    setPhase("hero");
  }, [handleRestart, persistGame, phase]);

  if (!hydrated) {
    return (
      <div className="game-shell mx-auto flex h-dvh max-h-dvh w-full max-w-[430px] flex-col overflow-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))]" />
    );
  }

  return (
    <div
      className={`game-shell game-act-${isHero ? 1 : actInfo.act} relative mx-auto flex h-dvh max-h-dvh w-full flex-col overflow-hidden ${
        isHero
          ? "max-w-none px-0 pb-0 pt-0"
          : "max-w-[430px] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))]"
      }`}
    >
      {!isHero && (
        <div className="game-settings-bar relative z-[45] flex h-9 shrink-0 items-center justify-end pr-[max(0,env(safe-area-inset-right))]">
          <SettingsGearButton onClick={() => setSettingsOpen(true)} />
        </div>
      )}

      <SettingsMenu
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentAct={actInfo.act}
        onClearSave={handleSettingsClearSave}
        onReturnToMainMenu={handleSettingsReturnToMainMenu}
        showGearButton={false}
      />

      <div
        className={`flex min-h-0 flex-1 flex-col transition-[filter] duration-200 ${
          settingsOpen && !isHero ? "pointer-events-none blur-[4px]" : ""
        } ${settingsOpen && isHero ? "pointer-events-none" : ""}`}
      >
      {phase === "playing" && (
        <p className="mb-1 shrink-0 text-center text-[10px] font-medium tracking-wide text-amber-200/68">
          <span className="tabular-nums text-amber-100/88">
            Seviye {playerLevel}
          </span>
          <span className="text-amber-600/45"> • </span>
          <span>{rankTitle}</span>
          <span className="text-amber-600/45"> • </span>
          <span className="text-amber-200/55">{actInfo.title}</span>
        </p>
      )}

      {showSkillBar && (
        <div className="mb-0.5 shrink-0">
          <SkillOrbs skills={skills} flashes={skillFlashes} />
        </div>
      )}

      <main className={isHero ? "flex min-h-0 flex-1 flex-col" : "game-play-main"}>
        {isHero ? (
          <HeroScreen
            hasSave={savePreview !== null}
            onNewGame={handleNewGame}
            onContinue={savePreview ? handleContinueSaved : undefined}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : isEnding && activeEnding ? (
          <EndingScreen
            ending={activeEnding}
            level={playerLevel}
            turnsPlayed={turnsPlayed}
            onRestart={handleRestart}
          />
        ) : isResult && pendingResult ? (
          <ResultScreen
            choiceLabel={pendingResult.choiceLabel}
            resultText={pendingResult.resultText}
            skillFeedbacks={pendingResult.skillFeedbacks}
            imageKey={pendingResult.resultImageKey}
            imagePrompt={pendingResult.resultImagePrompt}
            act={pendingResult.resultAct}
            tags={pendingResult.resultTags}
            showDevPrompt={false}
            onContinue={handleContinueResult}
          />
        ) : phase === "origin_intro" ? (
          <OriginIntroScreen origin={origin} onBegin={handleBegin} />
        ) : currentCard ? (
          <StoryCard
            card={currentCard}
            onChooseLeft={() => handleChoice("left")}
            onChooseRight={() => handleChoice("right")}
            disabled={isResolving || settingsOpen}
          />
        ) : (
          <p className="text-center text-sm text-amber-200/70">
            Yoluna uyan kart kalmadı. Saray sessizlikte bekliyor.
          </p>
        )}
      </main>

      {isDev && devTestNote && (
        <div className="mt-2 shrink-0 rounded-lg border border-violet-800/50 bg-violet-950/80 px-3 py-2 text-[10px] leading-snug text-violet-100/90">
          <p>{devTestNote}</p>
          <button
            type="button"
            onClick={() => setDevTestNote(null)}
            className="mt-1 text-[9px] font-medium text-violet-300/80 underline"
          >
            Kapat
          </button>
        </div>
      )}
      </div>

      <DevPanel
        origin={origin}
        currentCardId={currentCard?.id ?? null}
        phase={phase}
        playerLevel={playerLevel}
        rank={rankTitle}
        skills={skills}
        flags={flags}
        seenCardCount={seenCardIds.size}
        turnsPlayed={turnsPlayed}
        actions={devActions}
      />
    </div>
  );
}
