import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceQuestion,
  continueAfterResult,
  createProgress,
  resolveAnswer,
  startRound,
} from "../src/lib/quiz-engine.ts";
import type { Difficulty, QuizQuestion } from "../src/types/quiz.ts";

function makeQuestions(countPerDifficulty = 20): QuizQuestion[] {
  const difficulties: Difficulty[] = ["mudah", "sedang", "sulit"];
  return difficulties.flatMap((difficulty) =>
    Array.from({ length: countPerDifficulty }, (_, index) => ({
      id: `${difficulty}-${index}`,
      kind: "character" as const,
      difficulty,
      source: "materi" as const,
      question: "Siapakah aku?",
      answer: "Tokoh",
      explanation: "Penjelasan",
      verse: "Ayat 1:1",
    })),
  );
}

test("20 ronde selalu seimbang dan tidak mengulang soal", () => {
  const questions = makeQuestions();
  const difficultyById = new Map(questions.map((question) => [question.id, question.difficulty]));
  const seen = new Set<string>();
  let progress = startRound(createProgress(questions));

  for (let roundNumber = 1; roundNumber <= 20; roundNumber += 1) {
    assert.ok(progress.activeRound);
    const difficulties = progress.activeRound.ids.map((id) => difficultyById.get(id)).sort();
    assert.deepEqual(difficulties, ["mudah", "sedang", "sulit"]);
    progress.activeRound.ids.forEach((id) => {
      assert.equal(seen.has(id), false);
      seen.add(id);
    });

    for (let question = 0; question < 3; question += 1) {
      progress = resolveAnswer(progress, true, true);
      progress = advanceQuestion(progress);
    }
    assert.equal(progress.result?.roundNumber, roundNumber);
    progress = continueAfterResult(progress);
  }

  assert.equal(seen.size, 60);
  assert.equal(progress.completed, true);
  assert.equal(progress.activeRound, null);
});

test("0-1 jawaban benar mendapat 5 poin", () => {
  let progress = startRound(createProgress(makeQuestions(1)));
  progress = resolveAnswer(progress, true, true);
  progress = advanceQuestion(progress);
  progress = resolveAnswer(progress, false, false);
  progress = advanceQuestion(progress);
  progress = resolveAnswer(progress, false, false);
  progress = advanceQuestion(progress);
  assert.equal(progress.result?.correctCount, 1);
  assert.equal(progress.result?.points, 5);
});

test("2-3 jawaban benar mendapat 10 poin", () => {
  let progress = startRound(createProgress(makeQuestions(1)));
  progress = resolveAnswer(progress, true, true);
  progress = advanceQuestion(progress);
  progress = resolveAnswer(progress, true, true);
  progress = advanceQuestion(progress);
  progress = resolveAnswer(progress, false, false);
  progress = advanceQuestion(progress);
  assert.equal(progress.result?.correctCount, 2);
  assert.equal(progress.result?.points, 10);
});
