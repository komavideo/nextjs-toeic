import { getDueSrsItems } from "../srs/due.ts";
import {
  calculatePartStatistics,
  calculateTagWeaknessStatistics,
} from "../progress/statistics.ts";
import type { ProgressState } from "@/types/progress";
import type { Difficulty, QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { getAllQuestionBankEntries, getQuestionBankEntriesByPart } from "./index.ts";
import { type FlatQuestion, flattenQuestionBankEntries } from "./flatten.ts";

const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];
const minimumWeaknessTotalAnswers = 3;
const minimumWeaknessCandidateAnswers = 2;

type WeaknessCandidate =
  | {
      kind: "part";
      part: ToeicReadingPart;
      answered: number;
      correct: number;
    }
  | {
      kind: "tag";
      tag: string;
      part: ToeicReadingPart;
      answered: number;
      correct: number;
    };

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
  excludeQuestionIds?: ReadonlySet<string>;
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
  excludeQuestionIds?: ReadonlySet<string>,
): boolean {
  if (excludeQuestionIds?.has(question.questionId)) {
    return false;
  }

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
  excludeQuestionIds,
}: PartSessionQueueOptions): FlatQuestion[] {
  const entries = getQuestionBankEntriesByPart(part);

  if (part === "part5") {
    return flattenQuestionBankEntries(entries)
      .filter((question) =>
        flatQuestionMatchesCondition(
          question,
          difficulty,
          tag,
          excludeQuestionIds,
        ),
      )
      .slice(0, 5);
  }

  if (excludeQuestionIds) {
    const matchedQuestions = entries
      .map((entry) =>
        flattenQuestionBankEntries([entry]).filter((question) =>
          flatQuestionMatchesCondition(
            question,
            difficulty,
            tag,
            excludeQuestionIds,
          ),
        ),
      )
      .find((questions) => questions.length > 0);

    return matchedQuestions ?? [];
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

function getWeakestPartForTag(
  progressState: ProgressState,
  tag: string,
): ToeicReadingPart | undefined {
  const statistics = new Map<
    ToeicReadingPart,
    { part: ToeicReadingPart; answered: number; correct: number }
  >();

  for (const answer of progressState.answers) {
    if (!answer.tags.includes(tag)) {
      continue;
    }

    const current = statistics.get(answer.part) ?? {
      part: answer.part,
      answered: 0,
      correct: 0,
    };

    statistics.set(answer.part, {
      part: answer.part,
      answered: current.answered + 1,
      correct: current.correct + (answer.correct ? 1 : 0),
    });
  }

  return Array.from(statistics.values()).sort(
    (left, right) =>
      left.correct / left.answered - right.correct / right.answered ||
      partOrder.indexOf(left.part) - partOrder.indexOf(right.part),
  )[0]?.part;
}

function compareWeaknessCandidates(
  left: WeaknessCandidate,
  right: WeaknessCandidate,
): number {
  // 丸め済みの accuracy ではなく生の正答率で比較し、getWeakestPartForTag と判定基準を揃える
  // （候補は answered >= minimumWeaknessCandidateAnswers でフィルタ済みのためゼロ除算は発生しない）
  const leftAccuracy = left.correct / left.answered;
  const rightAccuracy = right.correct / right.answered;

  if (leftAccuracy !== rightAccuracy) {
    return leftAccuracy - rightAccuracy;
  }

  if (left.kind !== right.kind) {
    return left.kind === "part" ? -1 : 1;
  }

  if (left.kind === "part" && right.kind === "part") {
    return partOrder.indexOf(left.part) - partOrder.indexOf(right.part);
  }

  if (left.kind === "tag" && right.kind === "tag") {
    return left.tag.localeCompare(right.tag);
  }

  return 0;
}

function createWeaknessCandidates(
  progressState: ProgressState,
): WeaknessCandidate[] {
  const partCandidates = calculatePartStatistics(progressState.answers)
    .filter((statistic) => statistic.answered >= minimumWeaknessCandidateAnswers)
    .map(
      (statistic): WeaknessCandidate => ({
        kind: "part",
        part: statistic.part,
        answered: statistic.answered,
        correct: statistic.correct,
      }),
    );
  const tagCandidates = calculateTagWeaknessStatistics(progressState.answers)
    .filter((statistic) => statistic.answered >= minimumWeaknessCandidateAnswers)
    .flatMap((statistic): WeaknessCandidate[] => {
      const part = getWeakestPartForTag(progressState, statistic.tag);

      if (!part) {
        return [];
      }

      return [
        {
          kind: "tag",
          tag: statistic.tag,
          part,
          answered: statistic.answered,
          correct: statistic.correct,
        },
      ];
    });

  return [...partCandidates, ...tagCandidates].sort(compareWeaknessCandidates);
}

function createQueueForWeaknessCandidate(
  candidate: WeaknessCandidate,
): FlatQuestion[] {
  if (candidate.kind === "part") {
    return createPartSessionQueue({ part: candidate.part });
  }

  return createPartSessionQueue({ part: candidate.part, tag: candidate.tag });
}

export function createWeaknessSessionQueue(
  progressState: ProgressState,
): FlatQuestion[] {
  if (progressState.answers.length < minimumWeaknessTotalAnswers) {
    return createQuickSessionQueue("part5");
  }

  for (const candidate of createWeaknessCandidates(progressState)) {
    const queue = createQueueForWeaknessCandidate(candidate);

    if (queue.length > 0) {
      return queue;
    }
  }

  return createQuickSessionQueue("part5");
}
