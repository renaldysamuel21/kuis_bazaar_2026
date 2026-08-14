"use client";

import {
  ArrowCounterClockwise,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle,
  House,
  Medal,
  Question,
  Sparkle,
  Star,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type confettiFunction from "canvas-confetti";

import questionData from "@/data/questions.json";
import {
  advanceQuestion,
  continueAfterResult,
  createProgress,
  isValidProgress,
  resolveAnswer,
  revealAnswer,
  startRound,
  undoAnswer,
} from "@/lib/quiz-engine";
import type {
  CharacterQuestion,
  GameMode,
  GameProgress,
  QuizQuestion,
  TrueFalseQuestion,
} from "@/types/quiz";

import { Mascot } from "./Mascot";

const STORAGE_KEY = "kuis-bazaar-2026-progress-v1";

const characterQuestions = questionData.characterQuestions as CharacterQuestion[];
const trueFalseQuestions = questionData.trueFalseQuestions as TrueFalseQuestion[];

type ProgressMap = Partial<Record<GameMode, GameProgress>>;
type Screen = "home" | "playing" | "result";

const subscribeToHydration = () => () => undefined;

const modeCopy: Record<GameMode, { title: string; short: string }> = {
  character: { title: "Tebak Tokoh Alkitab", short: "Tebak Tokoh" },
  "true-false": { title: "Benar atau Salah", short: "Benar / Salah" },
};

function questionsForMode(mode: GameMode): QuizQuestion[] {
  return mode === "character" ? characterQuestions : trueFalseQuestions;
}

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return Object.fromEntries(
      (["character", "true-false"] as GameMode[]).flatMap((mode) => {
        const candidate = parsed[mode];
        return isValidProgress(candidate, questionsForMode(mode))
          ? [[mode, candidate]]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

function DifficultyDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="round-dots" aria-label={`Soal ${activeIndex + 1} dari 3`}>
      {[0, 1, 2].map((index) => (
        <span
          className={index === activeIndex ? "round-dot round-dot--active" : "round-dot"}
          key={index}
        />
      ))}
    </div>
  );
}

function ResultCelebration({ points }: { points: 5 | 10 }) {
  const reduceMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(!reduceMotion);
  const confettiRef = useRef<typeof confettiFunction | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const timers: number[] = [];

    void import("canvas-confetti").then((module) => {
      if (cancelled) return;
      const confetti = (module as unknown as { default: typeof confettiFunction }).default;
      confettiRef.current = confetti;
      const colors = ["#e88845", "#ffd76a", "#77cfb7", "#d06f36", "#ffffff"];
      if (points === 10) {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.58 }, colors });
        timers.push(
          window.setTimeout(() => {
            confetti({ particleCount: 55, angle: 60, spread: 60, origin: { x: 0, y: 0.65 }, colors });
            confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1, y: 0.65 }, colors });
          }, 350),
        );
      } else {
        confetti({ particleCount: 28, spread: 48, startVelocity: 22, origin: { y: 0.68 }, colors });
      }
      timers.push(window.setTimeout(() => setIsPlaying(false), points === 10 ? 1800 : 900));
    });

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      confettiRef.current?.reset();
    };
  }, [points, reduceMotion]);

  if (!isPlaying) return null;
  return (
    <button
      className="stop-animation"
      onClick={() => {
        confettiRef.current?.reset();
        setIsPlaying(false);
      }}
      type="button"
    >
      Hentikan animasi
    </button>
  );
}

export function GameApp() {
  const reduceMotion = useReducedMotion();
  const ready = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    typeof window === "undefined" ? {} : loadProgress(),
  );

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  }, [progressMap, ready]);

  const progress = mode ? progressMap[mode] : undefined;
  const allQuestions = useMemo(() => (mode ? questionsForMode(mode) : []), [mode]);
  const currentQuestion = useMemo(() => {
    const id = progress?.activeRound?.ids[progress.activeRound.questionIndex];
    return id ? allQuestions.find((question) => question.id === id) : undefined;
  }, [allQuestions, progress]);

  const updateProgress = useCallback(
    (updater: (current: GameProgress) => GameProgress) => {
      if (!mode) return;
      setProgressMap((current) => {
        const active = current[mode];
        if (!active) return current;
        return { ...current, [mode]: updater(active) };
      });
    },
    [mode],
  );

  const selectMode = (selectedMode: GameMode) => {
    const questions = questionsForMode(selectedMode);
    setMode(selectedMode);
    setProgressMap((current) => {
      let next = current[selectedMode];
      if (!next || (next.completed && !next.result)) {
        next = createProgress(questions);
      }
      if (!next.activeRound && !next.result) next = startRound(next);
      setScreen(next.result ? "result" : "playing");
      return { ...current, [selectedMode]: next };
    });
  };

  const goHome = () => setScreen("home");

  const handleTrueFalse = (selected: boolean) => {
    if (!currentQuestion || currentQuestion.kind !== "true-false") return;
    updateProgress((current) =>
      resolveAnswer(current, selected === currentQuestion.answer, selected),
    );
  };

  const handleNext = () => {
    if (!progress?.activeRound) return;
    const finishingRound = progress.activeRound.questionIndex === 2;
    updateProgress(advanceQuestion);
    if (finishingRound) setScreen("result");
  };

  const handleUndo = () => {
    if (!currentQuestion || !progress?.activeRound?.resolved) return;
    const wasCorrect =
      progress.activeRound.selectedAnswer ===
      (currentQuestion.kind === "true-false" ? currentQuestion.answer : true);
    updateProgress((current) =>
      undoAnswer(current, wasCorrect, currentQuestion.kind === "character"),
    );
  };

  const handleContinue = () => {
    if (!progress) return;
    if (progress.completed) {
      updateProgress(continueAfterResult);
      setScreen("home");
      return;
    }
    updateProgress(continueAfterResult);
    setScreen("playing");
  };

  if (!ready) {
    return (
      <main className="room-shell loading-shell" aria-busy="true">
        <div className="loading-card">
          <div className="skeleton skeleton--badge" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--button" />
          <div className="skeleton skeleton--button" />
        </div>
      </main>
    );
  }

  if (characterQuestions.length !== 60 || trueFalseQuestions.length !== 60) {
    return (
      <main className="room-shell loading-shell">
        <div className="message-card" role="alert">
          <XCircle size={48} weight="fill" />
          <h1>Bank soal belum lengkap</h1>
          <p>Periksa kembali berkas soal sebelum permainan dimulai.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="room-shell">
      <div className="room-window" aria-hidden="true"><span /><span /><span /></div>
      <div className="room-shelf" aria-hidden="true"><i /><i /><i /></div>
      <div className="app-frame">
        <AnimatePresence mode="wait" initial={false}>
          {screen === "home" && (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="home-screen"
              exit={{ opacity: 0, y: -16 }}
              initial={{ opacity: 0, y: 16 }}
              key="home"
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <header className="home-heading">
                <p className="eyebrow"><Sparkle size={16} weight="fill" /> Bazaar Sekolah Minggu 2026</p>
                <h1>Ayo main!</h1>
                <p>Pilih permainan untuk memulai ronde baru.</p>
              </header>

              <div className="game-picker">
                <button className="game-choice game-choice--character" onClick={() => selectMode("character")} type="button">
                  <span className="game-choice__icon"><Question size={32} weight="bold" /></span>
                  <span><strong>Tebak Tokoh</strong><small>Siapakah aku?</small></span>
                  <ArrowRight className="game-choice__arrow" size={24} weight="bold" />
                </button>
                <button className="game-choice game-choice--truefalse" onClick={() => selectMode("true-false")} type="button">
                  <span className="game-choice__icon"><CheckCircle size={32} weight="fill" /></span>
                  <span><strong>Benar / Salah</strong><small>Pilih jawaban tepat</small></span>
                  <ArrowRight className="game-choice__arrow" size={24} weight="bold" />
                </button>
              </div>

              <div className="home-mascot-wrap">
                <div className="speech-bubble">Tiga soal, satu ronde!</div>
                <Mascot mood="ready" />
              </div>
            </motion.section>
          )}

          {screen === "playing" && mode && progress?.activeRound && currentQuestion && (
            <motion.section
              animate={{ opacity: 1, x: 0 }}
              className={`game-screen ${progress.activeRound.resolved ? "game-screen--resolved" : ""} ${
                currentQuestion.kind === "true-false" && progress.activeRound.resolved
                  ? progress.activeRound.selectedAnswer === currentQuestion.answer
                    ? "game-screen--correct"
                    : "game-screen--wrong"
                  : ""
              }`}
              exit={{ opacity: 0, x: -18 }}
              initial={{ opacity: 0, x: 18 }}
              key={`${mode}-${progress.cursor}-${progress.activeRound.questionIndex}`}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <header className="game-topbar">
                <button aria-label="Kembali ke menu utama" className="home-button" onClick={goHome} type="button">
                  <House size={23} weight="fill" />
                </button>
                <div>
                  <strong>{modeCopy[mode].short}</strong>
                </div>
                <DifficultyDots activeIndex={progress.activeRound.questionIndex} />
              </header>

              <div className="question-stage" aria-live="polite">
                <div className="question-meta">
                  <span>Soal {progress.activeRound.questionIndex + 1}</span>
                  <span className={`difficulty difficulty--${currentQuestion.difficulty}`}>{currentQuestion.difficulty}</span>
                </div>
                <h2>{currentQuestion.kind === "character" ? currentQuestion.question : currentQuestion.statement}</h2>

                {currentQuestion.kind === "character" && !progress.activeRound.revealed && (
                  <button className="primary-button" onClick={() => updateProgress(revealAnswer)} type="button">
                    <BookOpenText size={22} weight="bold" /> Lihat jawaban
                  </button>
                )}

                {currentQuestion.kind === "true-false" && !progress.activeRound.resolved && (
                  <div className="true-false-actions">
                    <button className="answer-button answer-button--true" onClick={() => handleTrueFalse(true)} type="button">
                      <CheckCircle size={29} weight="fill" /> Benar
                    </button>
                    <button className="answer-button answer-button--false" onClick={() => handleTrueFalse(false)} type="button">
                      <XCircle size={29} weight="fill" /> Salah
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {progress.activeRound.revealed && (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="answer-panel"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    >
                      <p className="answer-label">Jawaban</p>
                      <h3>
                        {currentQuestion.kind === "character"
                          ? currentQuestion.answer
                          : currentQuestion.answer
                            ? "BENAR"
                            : "SALAH"}
                      </h3>
                      {currentQuestion.kind === "true-false" && currentQuestion.correction && (
                        <p><strong>Perbaikan:</strong> {currentQuestion.correction}</p>
                      )}
                      {currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}
                      <small><BookOpenText size={16} weight="bold" /> {currentQuestion.verse}</small>
                    </motion.div>
                  )}
                </AnimatePresence>

                {currentQuestion.kind === "character" && progress.activeRound.revealed && !progress.activeRound.resolved && (
                  <div className="teacher-score">
                    <p>Jawaban anak tadi:</p>
                    <div>
                      <button className="score-button score-button--wrong" onClick={() => updateProgress((item) => resolveAnswer(item, false, false))} type="button">
                        <X size={24} weight="bold" /> Salah
                      </button>
                      <button className="score-button score-button--correct" onClick={() => updateProgress((item) => resolveAnswer(item, true, true))} type="button">
                        <Check size={24} weight="bold" /> Benar
                      </button>
                    </div>
                  </div>
                )}

                {progress.activeRound.resolved && (
                  <div className="resolved-actions">
                    <div className="feedback-line">
                      {progress.activeRound.selectedAnswer === (currentQuestion.kind === "true-false" ? currentQuestion.answer : true) ? (
                        <><CheckCircle size={23} weight="fill" /> Jawaban benar</>
                      ) : (
                        <><XCircle size={23} weight="fill" /> Jawaban salah</>
                      )}
                    </div>
                    <div className="navigation-actions">
                      <button className="back-button" onClick={handleUndo} type="button">
                        <ArrowCounterClockwise size={21} weight="bold" /> Kembali
                      </button>
                      <button className="primary-button" onClick={handleNext} type="button">
                        {progress.activeRound.questionIndex === 2 ? "Lihat hasil ronde" : "Soal berikutnya"}
                        <ArrowRight size={22} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="game-mascot"><Mascot compact mood={progress.activeRound.resolved ? "happy" : "thinking"} /></div>
            </motion.section>
          )}

          {screen === "result" && mode && progress?.result && (
            <motion.section
              animate={{ opacity: 1, scale: 1 }}
              className={`result-screen result-screen--${progress.result.points}`}
              exit={{ opacity: 0, scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.94 }}
              key={`result-${mode}-${progress.result.roundNumber}`}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
            >
              <button aria-label="Kembali ke menu utama" className="home-button result-home" onClick={goHome} type="button">
                <House size={23} weight="fill" />
              </button>
              <div className="result-stars" aria-hidden="true"><Star weight="fill" /><Star weight="fill" /><Star weight="fill" /></div>
              <Mascot mood={progress.result.points === 10 ? "proud" : "happy"} />
              <p className="eyebrow"><Medal size={17} weight="fill" /> Tiga soal selesai</p>
              <h2>{progress.result.points === 10 ? "Hebat sekali!" : "Tetap semangat!"}</h2>
              <p className="result-summary">Benar {progress.result.correctCount} dari 3 soal</p>
              <div className="points-pill"><strong>{progress.result.points}</strong><span>poin</span></div>
              <button className="primary-button result-next" onClick={handleContinue} type="button">
                {progress.completed ? "Kembali ke menu" : "Ronde berikutnya"}
                {progress.completed ? <House size={21} weight="fill" /> : <ArrowRight size={22} weight="bold" />}
              </button>
              {progress.completed && <p className="pool-finished">Semua 60 soal sudah dimainkan.</p>}
              <ResultCelebration points={progress.result.points} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <div className="room-floor" aria-hidden="true" />
    </main>
  );
}
