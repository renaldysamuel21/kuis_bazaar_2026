import type {
  ActiveRound,
  Difficulty,
  GameProgress,
  QuizQuestion,
} from "../types/quiz";

export const DIFFICULTIES: Difficulty[] = ["mudah", "sedang", "sulit"];
export const QUESTIONS_PER_ROUND = 3;

function browserRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 4_294_967_296;
  }
  return Math.random();
}

export function shuffle<T>(items: readonly T[], random = browserRandom): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function createProgress(questions: readonly QuizQuestion[]): GameProgress {
  const queues = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [
      difficulty,
      shuffle(
        questions
          .filter((question) => question.difficulty === difficulty)
          .map((question) => question.id),
      ),
    ]),
  ) as Record<Difficulty, string[]>;

  const queueSizes = DIFFICULTIES.map((difficulty) => queues[difficulty].length);
  if (queueSizes.some((size) => size === 0) || new Set(queueSizes).size !== 1) {
    throw new Error("Jumlah soal mudah, sedang, dan sulit harus sama.");
  }

  return {
    version: 1,
    queues,
    cursor: 0,
    activeRound: null,
    result: null,
    completed: false,
  };
}

export function startRound(progress: GameProgress): GameProgress {
  if (progress.completed || progress.activeRound || progress.result) {
    return progress;
  }

  const ids = DIFFICULTIES.map(
    (difficulty) => progress.queues[difficulty][progress.cursor],
  );
  if (ids.some((id) => !id)) {
    return { ...progress, completed: true };
  }

  const activeRound: ActiveRound = {
    ids: shuffle(ids),
    questionIndex: 0,
    correctCount: 0,
    revealed: false,
    resolved: false,
  };

  return { ...progress, activeRound };
}

export function revealAnswer(progress: GameProgress): GameProgress {
  if (!progress.activeRound || progress.activeRound.revealed) return progress;
  return {
    ...progress,
    activeRound: { ...progress.activeRound, revealed: true },
  };
}

export function resolveAnswer(
  progress: GameProgress,
  isCorrect: boolean,
  selectedAnswer?: boolean,
): GameProgress {
  if (!progress.activeRound || progress.activeRound.resolved) return progress;
  return {
    ...progress,
    activeRound: {
      ...progress.activeRound,
      revealed: true,
      resolved: true,
      selectedAnswer,
      correctCount: progress.activeRound.correctCount + (isCorrect ? 1 : 0),
    },
  };
}

export function advanceQuestion(progress: GameProgress): GameProgress {
  const round = progress.activeRound;
  if (!round?.resolved) return progress;

  if (round.questionIndex < QUESTIONS_PER_ROUND - 1) {
    return {
      ...progress,
      activeRound: {
        ...round,
        questionIndex: round.questionIndex + 1,
        revealed: false,
        resolved: false,
        selectedAnswer: undefined,
      },
    };
  }

  const nextCursor = progress.cursor + 1;
  const points: 5 | 10 = round.correctCount >= 2 ? 10 : 5;
  const totalRounds = progress.queues.mudah.length;
  return {
    ...progress,
    cursor: nextCursor,
    activeRound: null,
    result: {
      correctCount: round.correctCount,
      points,
      roundNumber: nextCursor,
    },
    completed: nextCursor >= totalRounds,
  };
}

export function continueAfterResult(progress: GameProgress): GameProgress {
  if (!progress.result) return progress;
  const cleared = { ...progress, result: null };
  return progress.completed ? cleared : startRound(cleared);
}

export function isValidProgress(
  progress: unknown,
  questions: readonly QuizQuestion[],
): progress is GameProgress {
  if (!progress || typeof progress !== "object") return false;
  const value = progress as Partial<GameProgress>;
  if (value.version !== 1 || !value.queues || typeof value.cursor !== "number") {
    return false;
  }
  const validIds = new Set(questions.map((question) => question.id));
  return DIFFICULTIES.every(
    (difficulty) =>
      Array.isArray(value.queues?.[difficulty]) &&
      value.queues[difficulty].every((id) => validIds.has(id)),
  );
}
