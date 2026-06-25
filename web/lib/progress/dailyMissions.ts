import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { ProgressState } from "@/types/progress";
import type { QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { flattenQuestionBankEntries } from "../question-bank/flatten.ts";
import { getDueSrsItems } from "../srs/due.ts";
import {
  calculatePartStatistics,
  calculateTagWeaknessStatistics,
  type PartStatistic,
  type TagStatistic,
} from "./statistics.ts";

export type DailyMissionKind =
  | "review"
  | "weak-part"
  | "weak-tag"
  | "unanswered"
  | "quick";

export type DailyMission = {
  kind: DailyMissionKind;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

const maxMissionCount = 3;
const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];
const questionBankEntriesByPart: Record<ToeicReadingPart, QuestionBankEntry[]> = {
  part5: part5Entries as QuestionBankEntry[],
  part6: part6Entries as QuestionBankEntry[],
  part7: part7Entries as QuestionBankEntry[],
};

function formatPart(part: ToeicReadingPart): string {
  return part.toUpperCase().replace("PART", "Part ");
}

function buildPracticeHref({
  mode,
  part,
  tag,
}: {
  mode: "quick" | "part";
  part: ToeicReadingPart;
  tag?: string;
}): string {
  const searchParams = new URLSearchParams({ mode, part });

  if (tag) {
    searchParams.set("tag", tag);
  }

  return `/practice?${searchParams.toString()}`;
}

function appendMission(
  missions: DailyMission[],
  mission: DailyMission | undefined,
): DailyMission[] {
  if (!mission || missions.length >= maxMissionCount) {
    return missions;
  }

  if (missions.some((item) => item.href === mission.href)) {
    return missions;
  }

  return [...missions, mission];
}

function getWeakestPart(
  partStatistics: PartStatistic[],
): PartStatistic | undefined {
  const answeredStatistics = partStatistics.filter(
    (statistic) => statistic.answered > 0,
  );

  if (answeredStatistics.length === 0) {
    return undefined;
  }

  return [...answeredStatistics].sort(
    (left, right) =>
      left.accuracy - right.accuracy ||
      partOrder.indexOf(left.part) - partOrder.indexOf(right.part),
  )[0];
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

function getMostUnansweredPart(
  progressState: ProgressState,
): { part: ToeicReadingPart; unanswered: number } | undefined {
  const answeredQuestionIds = new Set(
    progressState.answers.map((answer) => answer.questionId),
  );
  const unansweredCounts = partOrder.map((part) => {
    const questions = flattenQuestionBankEntries(questionBankEntriesByPart[part]);
    const answeredCount = questions.filter((question) =>
      answeredQuestionIds.has(question.questionId),
    ).length;

    return {
      part,
      unanswered: Math.max(questions.length - answeredCount, 0),
    };
  });

  return unansweredCounts
    .filter((item) => item.unanswered > 0)
    .sort(
      (left, right) =>
        right.unanswered - left.unanswered ||
        partOrder.indexOf(left.part) - partOrder.indexOf(right.part),
    )[0];
}

function createReviewMission(dueCount: number): DailyMission | undefined {
  if (dueCount === 0) {
    return undefined;
  }

  return {
    kind: "review",
    title: `復習を${dueCount}問消化`,
    description: "今日までに復習期限が来ている問題があります。",
    href: "/practice?mode=review",
    actionLabel: "復習を開始",
  };
}

function createWeakPartMission(
  statistic: PartStatistic | undefined,
): DailyMission | undefined {
  if (!statistic) {
    return undefined;
  }

  const partLabel = formatPart(statistic.part);

  return {
    kind: "weak-part",
    title: `${partLabel} を5問`,
    description: `現在の正答率は${statistic.accuracy}%です。苦手な Part を先に整えます。`,
    href: buildPracticeHref({ mode: "part", part: statistic.part }),
    actionLabel: "演習を開始",
  };
}

function createWeakTagMission(
  progressState: ProgressState,
  statistic: TagStatistic | undefined,
): DailyMission | undefined {
  if (!statistic) {
    return undefined;
  }

  const part = getWeakestPartForTag(progressState, statistic.tag);

  if (!part) {
    return undefined;
  }

  return {
    kind: "weak-tag",
    title: `苦手タグ「${statistic.tag}」を1セット`,
    description: `タグ別の正答率は${statistic.accuracy}%です。関連問題で確認します。`,
    href: buildPracticeHref({ mode: "part", part, tag: statistic.tag }),
    actionLabel: "タグ練習を開始",
  };
}

function createUnansweredMission(
  target: { part: ToeicReadingPart; unanswered: number } | undefined,
): DailyMission | undefined {
  if (!target) {
    return undefined;
  }

  const partLabel = formatPart(target.part);

  return {
    kind: "unanswered",
    title: `${partLabel} の未回答を進める`,
    description: `この Part には未回答が${target.unanswered}問あります。`,
    href: buildPracticeHref({ mode: "part", part: target.part }),
    actionLabel: "演習を開始",
  };
}

function createInitialMission(): DailyMission {
  return {
    kind: "quick",
    title: "Part 5 を5問クイック",
    description: "最初の5問で Reading の感覚をつかみます。",
    href: buildPracticeHref({ mode: "quick", part: "part5" }),
    actionLabel: "5問クイックを開始",
  };
}

export function createDailyMissions(
  progressState: ProgressState,
  today?: string,
): DailyMission[] {
  const dueItems = getDueSrsItems(progressState.srs, today);
  let missions = appendMission([], createReviewMission(dueItems.length));

  if (progressState.answers.length === 0) {
    return appendMission(missions, createInitialMission());
  }

  const partStatistics = calculatePartStatistics(progressState.answers);
  const weakTags = calculateTagWeaknessStatistics(progressState.answers);

  missions = appendMission(
    missions,
    createWeakPartMission(getWeakestPart(partStatistics)),
  );
  missions = appendMission(
    missions,
    createWeakTagMission(progressState, weakTags[0]),
  );
  missions = appendMission(
    missions,
    createUnansweredMission(getMostUnansweredPart(progressState)),
  );

  return missions;
}
