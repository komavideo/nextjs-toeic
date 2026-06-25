import { getDueSrsItems } from "../srs/due.ts";
import type { ProgressState } from "@/types/progress";
import type { Difficulty, QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { getAllQuestionBankEntries, getQuestionBankEntriesByPart } from "./index.ts";
import { type FlatQuestion, flattenQuestionBankEntries } from "./flatten.ts";

const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];
const minimumWeaknessTotalAnswers = 3;
const minimumWeaknessCandidateAnswers = 1;

type WeaknessAnswerStatistics = {
  answered: number;
  correct: number;
};

type WeaknessTagStatistics = WeaknessAnswerStatistics & {
  partStatistics: Map<ToeicReadingPart, WeaknessAnswerStatistics>;
};

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

function incrementWeaknessStatistics(
  statistics: WeaknessAnswerStatistics | undefined,
  correct: boolean,
): WeaknessAnswerStatistics {
  return {
    answered: (statistics?.answered ?? 0) + 1,
    correct: (statistics?.correct ?? 0) + (correct ? 1 : 0),
  };
}

function createWeaknessStatistics(answers: ProgressState["answers"]): {
  partStatistics: Map<ToeicReadingPart, WeaknessAnswerStatistics>;
  tagStatistics: Map<string, WeaknessTagStatistics>;
} {
  const partStatistics = new Map<ToeicReadingPart, WeaknessAnswerStatistics>();
  const tagStatistics = new Map<string, WeaknessTagStatistics>();

  for (const answer of answers) {
    partStatistics.set(
      answer.part,
      incrementWeaknessStatistics(partStatistics.get(answer.part), answer.correct),
    );

    for (const tag of answer.tags) {
      const current = tagStatistics.get(tag) ?? {
        answered: 0,
        correct: 0,
        partStatistics: new Map<ToeicReadingPart, WeaknessAnswerStatistics>(),
      };

      tagStatistics.set(tag, {
        answered: current.answered + 1,
        correct: current.correct + (answer.correct ? 1 : 0),
        partStatistics: new Map(current.partStatistics).set(
          answer.part,
          incrementWeaknessStatistics(
            current.partStatistics.get(answer.part),
            answer.correct,
          ),
        ),
      });
    }
  }

  return { partStatistics, tagStatistics };
}

function toRawAccuracy(statistics: WeaknessAnswerStatistics): number {
  return statistics.correct / statistics.answered;
}

function getWeakestPartFromTagStatistics(
  statistics: WeaknessTagStatistics,
): ToeicReadingPart | undefined {
  return Array.from(statistics.partStatistics.entries()).sort(
    ([leftPart, leftStatistics], [rightPart, rightStatistics]) =>
      toRawAccuracy(leftStatistics) - toRawAccuracy(rightStatistics) ||
      partOrder.indexOf(leftPart) - partOrder.indexOf(rightPart),
  )[0]?.[0];
}

function compareWeaknessCandidates(
  left: WeaknessCandidate,
  right: WeaknessCandidate,
): number {
  // 丸め済みの accuracy ではなく生の正答率で比較し、タグ内の最弱 Part 判定と基準を揃える
  // （候補は answered >= minimumWeaknessCandidateAnswers でフィルタ済みのためゼロ除算は発生しない）
  const leftAccuracy = toRawAccuracy(left);
  const rightAccuracy = toRawAccuracy(right);

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
  const { partStatistics, tagStatistics } = createWeaknessStatistics(
    progressState.answers,
  );
  const partCandidates = partOrder.flatMap((part): WeaknessCandidate[] => {
    const statistic = partStatistics.get(part);

    if (!statistic || statistic.answered < minimumWeaknessCandidateAnswers) {
      return [];
    }

    return [
      {
        kind: "part",
        part,
        answered: statistic.answered,
        correct: statistic.correct,
      },
    ];
  });
  const tagCandidates = Array.from(tagStatistics.entries())
    .filter(([, statistic]) => statistic.answered >= minimumWeaknessCandidateAnswers)
    .flatMap((statistic): WeaknessCandidate[] => {
      const [tag, tagStatistic] = statistic;
      const part = getWeakestPartFromTagStatistics(tagStatistic);

      if (!part) {
        return [];
      }

      return [
        {
          kind: "tag",
          tag,
          part,
          answered: tagStatistic.answered,
          correct: tagStatistic.correct,
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
