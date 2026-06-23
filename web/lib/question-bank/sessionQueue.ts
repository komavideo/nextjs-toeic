import { getDueSrsItems } from "@/lib/srs/due";
import type { ProgressState } from "@/types/progress";
import type { Difficulty, QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { getAllQuestionBankEntries, getQuestionBankEntriesByPart } from "./index";
import { type FlatQuestion, flattenQuestionBankEntries } from "./flatten";

function pickFirstPassageSet(entries: QuestionBankEntry[]): QuestionBankEntry[] {
  return entries.length > 0 ? [entries[0]] : [];
}

export function createQuickSessionQueue(
  part: ToeicReadingPart = "part5",
): FlatQuestion[] {
  const entries = getQuestionBankEntriesByPart(part);

  if (part === "part5") {
    return flattenQuestionBankEntries(entries).slice(0, 5);
  }

  return flattenQuestionBankEntries(pickFirstPassageSet(entries));
}

export type PartSessionQueueOptions = {
  part: ToeicReadingPart;
  difficulty?: Difficulty;
  tag?: string;
};

function entryMatchesCondition(
  entry: QuestionBankEntry,
  difficulty?: Difficulty,
  tag?: string,
): boolean {
  if (difficulty && entry.difficulty !== difficulty) {
    return false;
  }

  if (tag && !entry.tags.includes(tag)) {
    return false;
  }

  return true;
}

export function createPartSessionQueue({
  part,
  difficulty,
  tag,
}: PartSessionQueueOptions): FlatQuestion[] {
  const entries = getQuestionBankEntriesByPart(part);

  if (part === "part5") {
    return flattenQuestionBankEntries(entries)
      .filter((question) => {
        if (difficulty && question.difficulty !== difficulty) {
          return false;
        }

        if (tag && !question.tags.includes(tag)) {
          return false;
        }

        return true;
      })
      .slice(0, 5);
  }

  const matchedSet = entries.find((entry) =>
    entryMatchesCondition(entry, difficulty, tag),
  );

  return flattenQuestionBankEntries(matchedSet ? [matchedSet] : []);
}

export function createReviewSessionQueue(progressState: ProgressState): FlatQuestion[] {
  const allQuestions = flattenQuestionBankEntries(getAllQuestionBankEntries());
  const questionMap = new Map(
    allQuestions.map((question) => [question.questionId, question]),
  );

  return getDueSrsItems(progressState.srs)
    .map((item) => questionMap.get(item.questionId))
    .filter((question): question is FlatQuestion => Boolean(question));
}
