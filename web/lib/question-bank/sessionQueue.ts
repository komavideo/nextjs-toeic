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

type SessionQueuePriorityOptions = {
  progressState?: ProgressState;
  today?: string;
};

// 出題優先度のランク。数値が小さいほど優先的に出題する。
// 0 = 未回答（最優先） / 1 = SRS 復習期限到来 / 2 = 誤答履歴あり / 3 = 正答済み（最低優先）。
type QuestionPriority = {
  rank: 0 | 1 | 2 | 3;
  dueDate?: string;
};

type QuestionPriorityContext = {
  answeredQuestionIds: ReadonlySet<string>;
  dueSrsByQuestionId: ReadonlyMap<string, string>;
  incorrectQuestionIds: ReadonlySet<string>;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDueSrsByQuestionId(
  srs: ProgressState["srs"],
  today = toDateKey(new Date()),
): Map<string, string> {
  const dueSrsByQuestionId = new Map<string, string>();

  for (const item of Object.values(srs)) {
    if (item.dueDate <= today) {
      dueSrsByQuestionId.set(item.questionId, item.dueDate);
    }
  }

  return dueSrsByQuestionId;
}

export function createQuickSessionQueue(
  part: ToeicReadingPart = "part5",
  options: SessionQueuePriorityOptions = {},
): FlatQuestion[] {
  const entries = getQuestionBankEntriesByPart(part);
  const priorityContext = createQuestionPriorityContext(options);

  if (part === "part5") {
    return sortFlatQuestionsByPriority(
      flattenQuestionBankEntries(entries),
      priorityContext,
    ).slice(0, 5);
  }

  const entry = pickPrioritizedPassageSet(entries, priorityContext);

  return flattenPrioritizedPassageSet(entry, priorityContext);
}

export type PartSessionQueueOptions = {
  part: ToeicReadingPart;
  difficulty?: Difficulty;
  tag?: string;
  progressState?: ProgressState;
  today?: string;
};

function createQuestionPriorityContext({
  progressState,
  today,
}: SessionQueuePriorityOptions): QuestionPriorityContext | undefined {
  if (!progressState) {
    return undefined;
  }

  const answeredQuestionIds = new Set<string>();
  const incorrectQuestionIds = new Set<string>();

  for (const answer of progressState.answers) {
    answeredQuestionIds.add(answer.questionId);

    if (!answer.correct) {
      incorrectQuestionIds.add(answer.questionId);
    }
  }

  return {
    answeredQuestionIds,
    dueSrsByQuestionId: getDueSrsByQuestionId(progressState.srs, today),
    incorrectQuestionIds,
  };
}

function getQuestionPriority(
  question: FlatQuestion,
  context: QuestionPriorityContext | undefined,
): QuestionPriority {
  // 進捗が無い、または回答履歴に含まれない問題は未回答として最優先（rank 0）扱い。
  if (!context || !context.answeredQuestionIds.has(question.questionId)) {
    return { rank: 0 };
  }

  const dueDate = context.dueSrsByQuestionId.get(question.questionId);

  // SRS 復習期限が到来している問題（rank 1）。dueDate でさらに早い期限を優先する。
  if (dueDate) {
    return { rank: 1, dueDate };
  }

  // 誤答履歴がある問題（rank 2）。
  if (context.incorrectQuestionIds.has(question.questionId)) {
    return { rank: 2 };
  }

  // 正答済み・定着済みの問題（rank 3、最低優先）。
  return { rank: 3 };
}

function compareQuestionPriority(
  left: QuestionPriority,
  right: QuestionPriority,
): number {
  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }

  if (left.rank === 1 && right.rank === 1) {
    return (left.dueDate ?? "").localeCompare(right.dueDate ?? "");
  }

  return 0;
}

function sortFlatQuestionsByPriority(
  questions: FlatQuestion[],
  context: QuestionPriorityContext | undefined,
): FlatQuestion[] {
  if (!context) {
    return questions;
  }

  return [...questions].sort((left, right) =>
    compareQuestionPriority(
      getQuestionPriority(left, context),
      getQuestionPriority(right, context),
    ),
  );
}

function flattenPrioritizedPassageSet(
  entry: QuestionBankEntry | undefined,
  context: QuestionPriorityContext | undefined,
): FlatQuestion[] {
  return sortFlatQuestionsByPriority(
    flattenQuestionBankEntries(entry ? [entry] : []),
    context,
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
  entryDifficulty?: Difficulty,
): boolean {
  if (
    difficulty &&
    question.difficulty !== difficulty &&
    entryDifficulty !== difficulty
  ) {
    return false;
  }

  if (tag && !question.tags.includes(tag)) {
    return false;
  }

  return true;
}

function getPrioritizedQuestionFromPassageSet(
  entry: QuestionBankEntry,
  context: QuestionPriorityContext | undefined,
  difficulty?: Difficulty,
  tag?: string,
): { priority: QuestionPriority } | undefined {
  const questions = flattenQuestionBankEntries([entry]).filter((question) =>
    flatQuestionMatchesCondition(question, difficulty, tag, entry.difficulty),
  );

  if (questions.length === 0) {
    return undefined;
  }

  const [question] = sortFlatQuestionsByPriority(questions, context);

  return { priority: getQuestionPriority(question, context) };
}

function pickPrioritizedPassageSet(
  entries: QuestionBankEntry[],
  context: QuestionPriorityContext | undefined,
  difficulty?: Difficulty,
  tag?: string,
): QuestionBankEntry | undefined {
  return entries
    .map((entry, index) => {
      const matched = getPrioritizedQuestionFromPassageSet(
        entry,
        context,
        difficulty,
        tag,
      );

      if (!matched) {
        return undefined;
      }

      return { entry, index, priority: matched.priority };
    })
    .filter(
      (
        item,
      ): item is {
        entry: QuestionBankEntry;
        index: number;
        priority: QuestionPriority;
      } => Boolean(item),
    )
    .sort(
      (left, right) =>
        compareQuestionPriority(left.priority, right.priority) ||
        left.index - right.index,
    )[0]?.entry;
}

export function createPartSessionQueue({
  part,
  difficulty,
  tag,
  progressState,
  today,
}: PartSessionQueueOptions): FlatQuestion[] {
  const entries = getQuestionBankEntriesByPart(part);
  const priorityContext = createQuestionPriorityContext({ progressState, today });

  if (part === "part5") {
    return sortFlatQuestionsByPriority(
      flattenQuestionBankEntries(entries).filter((question) =>
        flatQuestionMatchesCondition(question, difficulty, tag),
      ),
      priorityContext,
    ).slice(0, 5);
  }

  const matchedSet = pickPrioritizedPassageSet(
    entries,
    priorityContext,
    difficulty,
    tag,
  );

  return flattenPrioritizedPassageSet(matchedSet, priorityContext);
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
  progressState: ProgressState,
): FlatQuestion[] {
  if (candidate.kind === "part") {
    return createPartSessionQueue({ part: candidate.part, progressState });
  }

  return createPartSessionQueue({
    part: candidate.part,
    progressState,
    tag: candidate.tag,
  });
}

export function createWeaknessSessionQueue(
  progressState: ProgressState,
): FlatQuestion[] {
  if (progressState.answers.length < minimumWeaknessTotalAnswers) {
    return createQuickSessionQueue("part5", { progressState });
  }

  for (const candidate of createWeaknessCandidates(progressState)) {
    const queue = createQueueForWeaknessCandidate(candidate, progressState);

    if (queue.length > 0) {
      return queue;
    }
  }

  return createQuickSessionQueue("part5", { progressState });
}
