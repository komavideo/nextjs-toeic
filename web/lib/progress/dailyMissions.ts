import type { ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";
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

// ホームのクライアントバンドルへ問題本文・解説を取り込まないよう、
// 未回答数は Part 別の軽量な総設問数だけで判定する。
export const questionCountsByPart: Record<ToeicReadingPart, number> = {
  part5: 220,
  part6: 42,
  part7: 42,
};

// "part5" → "Part 5" のように表示用ラベルへ整形する。
function formatPart(part: ToeicReadingPart): string {
  return part.toUpperCase().replace("PART", "Part ");
}

function buildPracticeHref({
  mode,
  part,
  tag,
  unansweredPriority,
}: {
  mode: "quick" | "part";
  part: ToeicReadingPart;
  tag?: string;
  unansweredPriority?: boolean;
}): string {
  const searchParams = new URLSearchParams({ mode, part });

  if (tag) {
    searchParams.set("tag", tag);
  }

  if (unansweredPriority) {
    searchParams.set("unanswered", "1");
  }

  return `/practice?${searchParams.toString()}`;
}

// ミッションを追加する。最大件数（3件）に達している場合や、同じ遷移先（href）が
// 既にある場合は追加しない（導線の重複を抑止する）。
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

// 指定タグを含む回答だけを Part 別に集計し、正答率が最も低い Part を返す
// （同率の場合は part5 → part6 → part7 の順を優先）。
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

// 未回答が最も多く残っている Part を返す（同数の場合は part5 → part6 → part7 の順を優先）。
function getMostUnansweredPart(
  progressState: ProgressState,
): { part: ToeicReadingPart; unanswered: number } | undefined {
  const answeredQuestionIdsByPart = new Map<ToeicReadingPart, Set<string>>();

  for (const answer of progressState.answers) {
    const questionIds =
      answeredQuestionIdsByPart.get(answer.part) ?? new Set<string>();
    questionIds.add(answer.questionId);
    answeredQuestionIdsByPart.set(answer.part, questionIds);
  }

  const unansweredCounts = partOrder.map((part) => {
    const answeredCount = answeredQuestionIdsByPart.get(part)?.size ?? 0;

    return {
      part,
      unanswered: Math.max(questionCountsByPart[part] - answeredCount, 0),
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
  const title =
    statistic.part === "part5"
      ? `${partLabel} をクイック演習`
      : `${partLabel} を1セット`;

  return {
    kind: "weak-part",
    title,
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
    href: buildPracticeHref({
      mode: "part",
      part: target.part,
      unansweredPriority: true,
    }),
    actionLabel: "演習を開始",
  };
}

function createInitialMission(): DailyMission {
  return {
    kind: "quick",
    title: "Part 5 クイック",
    description: "既定の5問で Reading の感覚をつかみます。",
    href: buildPracticeHref({ mode: "quick", part: "part5" }),
    actionLabel: "クイックを開始",
  };
}

// 呼び出し元（HomeDashboard）が表示用に算出済みの統計を再利用するための任意引数。
// 省略時は内部で計算するため、テストや EmptyState からはそのまま呼び出せる。
type DailyMissionDeps = {
  partStatistics?: PartStatistic[];
  weakTags?: TagStatistic[];
  dueCount?: number;
};

// 今日の学習ミッションを「復習 → 苦手 Part → 苦手タグ → 未回答」の優先順で最大3件生成する。
export function createDailyMissions(
  progressState: ProgressState,
  today?: string,
  deps?: DailyMissionDeps,
): DailyMission[] {
  const dueCount =
    deps?.dueCount ?? getDueSrsItems(progressState.srs, today).length;
  let missions = appendMission([], createReviewMission(dueCount));

  // 回答履歴がなければ最初の一歩としてクイック演習だけを促す。
  if (progressState.answers.length === 0) {
    return appendMission(missions, createInitialMission());
  }

  const partStatistics =
    deps?.partStatistics ?? calculatePartStatistics(progressState.answers);
  const weakTags =
    deps?.weakTags ?? calculateTagWeaknessStatistics(progressState.answers);

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
