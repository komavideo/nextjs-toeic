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
  if (entry.part === "part5") {
    if (difficulty && entry.difficulty !== difficulty) {
      return false;
    }

    if (tag && !entry.tags.includes(tag)) {
      return false;
    }

    return true;
  }

  return entry.questions.some(
    (question) =>
      (!difficulty ||
        entry.difficulty === difficulty ||
        question.difficulty === difficulty) &&
      (!tag || entry.tags.includes(tag) || question.tags.includes(tag)),
  );
}

export function findFirstPartByTag(tag: string): ToeicReadingPart | undefined {
  const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];

  return partOrder.find((part) =>
    flattenQuestionBankEntries(getQuestionBankEntriesByPart(part)).some(
      (question) => question.tags.includes(tag),
    ),
  );
}

export function getAvailableTagsByPart(part: ToeicReadingPart): string[] {
  const tags = flattenQuestionBankEntries(getQuestionBankEntriesByPart(part))
    .flatMap((question) => question.tags);

  return Array.from(new Set(tags)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function flatQuestionMatchesCondition(
  question: FlatQuestion,
  difficulty?: Difficulty,
  tag?: string,
): boolean {
  if (difficulty && question.difficulty !== difficulty) {
    return false;
  }

  if (tag && !question.tags.includes(tag)) {
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
      .filter((question) =>
        flatQuestionMatchesCondition(question, difficulty, tag),
      )
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
