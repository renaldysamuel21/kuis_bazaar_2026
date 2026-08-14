export type Difficulty = "mudah" | "sedang" | "sulit";
export type GameMode = "character" | "true-false";

export interface BaseQuestion {
  id: string;
  difficulty: Difficulty;
  source: "materi" | "tambahan";
  verse: string;
}

export interface CharacterQuestion extends BaseQuestion {
  kind: "character";
  question: string;
  answer: string;
  explanation: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  kind: "true-false";
  statement: string;
  answer: boolean;
  correction?: string;
  explanation?: string;
}

export type QuizQuestion = CharacterQuestion | TrueFalseQuestion;

export interface ActiveRound {
  ids: string[];
  questionIndex: number;
  correctCount: number;
  revealed: boolean;
  resolved: boolean;
  selectedAnswer?: boolean;
}

export interface GameProgress {
  version: 1;
  queues: Record<Difficulty, string[]>;
  cursor: number;
  activeRound: ActiveRound | null;
  result: { correctCount: number; points: 5 | 10; roundNumber: number } | null;
  completed: boolean;
}
