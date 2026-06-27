import type { AnswerResult, ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";
import type { BadgeMetrics } from "./types.ts";

const readingParts: ToeicReadingPart[] = ["part5", "part6", "part7"];

// セッション境界（sessionId）は保存していないため、回答間の空き時間で近似分割する。
// 既定 30 分以上空いたら別セッションとみなす。
export const sessionGapMs = 30 * 60 * 1000;
// パーフェクト判定の最小設問数（既定の1セッション出題数に合わせる）。
export const minPerfectSessionSize = 5;
// 苦手タグ克服の判定パラメータ（最小回答数 / 直近の連続正解数）。
export const weakTagGate = 8;
export const weakTagRecentWindow = 5;

type DeriveBadgeMetricsOptions = {
  sessionGapMs?: number;
};

function toCumulativeAccuracy(correct: number, answered: number): number {
  return answered === 0 ? 0 : Math.round((correct / answered) * 100);
}

// answeredAt は toISOString() 由来の UTC 固定書式のため、辞書順比較が時系列順と一致する。
// Intl コレーションを伴う localeCompare より軽い単純比較で昇順ソートする。
function compareIsoAsc(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

// 回答履歴を回答時刻の昇順で、空き時間が gapMs を超える箇所で区切ってセッション近似に分割する。
export function groupAnswersIntoSessions(
  answers: AnswerResult[],
  gapMs: number = sessionGapMs,
): AnswerResult[][] {
  const sorted = [...answers].sort((left, right) =>
    compareIsoAsc(left.answeredAt, right.answeredAt),
  );
  const groups: AnswerResult[][] = [];
  let currentGroup: AnswerResult[] = [];
  let previousTime: number | null = null;

  for (const answer of sorted) {
    const time = new Date(answer.answeredAt).getTime();

    if (previousTime !== null && time - previousTime > gapMs) {
      groups.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push(answer);
    previousTime = time;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// パーフェクト（最小設問数以上かつ全問正解）なセッション近似の回数を数える。
function countPerfectSessions(answers: AnswerResult[], gapMs: number): number {
  return groupAnswersIntoSessions(answers, gapMs).filter(
    (group) =>
      group.length >= minPerfectSessionSize &&
      group.every((answer) => answer.correct),
  ).length;
}

// 苦手タグを克服したか判定する。あるタグで「最小回答数以上 / 前半の正答率が5割未満 /
// 直近の連続正解が窓数すべて正解」を満たすタグが1つでもあれば true。
function hasOvercomeWeakTag(answers: AnswerResult[]): boolean {
  const answersByTag = new Map<string, AnswerResult[]>();

  for (const answer of answers) {
    for (const tag of answer.tags) {
      const tagAnswers = answersByTag.get(tag) ?? [];
      tagAnswers.push(answer);
      answersByTag.set(tag, tagAnswers);
    }
  }

  for (const tagAnswers of answersByTag.values()) {
    if (tagAnswers.length < weakTagGate) {
      continue;
    }

    const sorted = [...tagAnswers].sort((left, right) =>
      compareIsoAsc(left.answeredAt, right.answeredAt),
    );
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const firstHalfCorrect = firstHalf.filter(
      (answer) => answer.correct,
    ).length;
    const recent = sorted.slice(-weakTagRecentWindow);

    const struggledEarly =
      firstHalf.length > 0 && firstHalfCorrect / firstHalf.length < 0.5;
    const recentlyMastered =
      recent.length >= weakTagRecentWindow &&
      recent.every((answer) => answer.correct);

    if (struggledEarly && recentlyMastered) {
      return true;
    }
  }

  return false;
}

function isEarlyMorning(answer: AnswerResult): boolean {
  const hours = new Date(answer.answeredAt).getHours();
  return hours >= 5 && hours <= 8;
}

function isLateNight(answer: AnswerResult): boolean {
  const hours = new Date(answer.answeredAt).getHours();
  return hours >= 22 || hours <= 4;
}

/**
 * 進捗状態から、バッジ判定に必要な派生指標を一度だけ算出する。
 * 問題バンク JSON には依存せず、回答履歴と SRS 状態だけで完結する。
 */
export function deriveBadgeMetrics(
  state: ProgressState,
  options?: DeriveBadgeMetricsOptions,
): BadgeMetrics {
  const gapMs = options?.sessionGapMs ?? sessionGapMs;
  const answeredQuestionIds = new Set<string>();
  const answeredQuestionIdsByPart: Record<ToeicReadingPart, Set<string>> = {
    part5: new Set(),
    part6: new Set(),
    part7: new Set(),
  };

  for (const answer of state.answers) {
    answeredQuestionIds.add(answer.questionId);
    answeredQuestionIdsByPart[answer.part].add(answer.questionId);
  }

  const srsQuestionIds = new Set(Object.keys(state.srs));
  let masteredCount = 0;
  for (const questionId of answeredQuestionIds) {
    if (!srsQuestionIds.has(questionId)) {
      masteredCount += 1;
    }
  }

  const answeredByPart = {
    part5: answeredQuestionIdsByPart.part5.size,
    part6: answeredQuestionIdsByPart.part6.size,
    part7: answeredQuestionIdsByPart.part7.size,
  };
  const answeredPartCount = readingParts.filter(
    (part) => answeredByPart[part] > 0,
  ).length;

  return {
    currentStreakDays: state.currentStreakDays,
    totalAnswered: state.totalAnswered,
    totalCorrect: state.totalCorrect,
    cumulativeAccuracy: toCumulativeAccuracy(
      state.totalCorrect,
      state.totalAnswered,
    ),
    distinctAnswered: answeredQuestionIds.size,
    answeredByPart,
    answeredPartCount,
    masteredCount,
    perfectSessionCount: countPerfectSessions(state.answers, gapMs),
    overcameWeakTag: hasOvercomeWeakTag(state.answers),
    hasEarlyMorningAnswer: state.answers.some(isEarlyMorning),
    hasLateNightAnswer: state.answers.some(isLateNight),
  };
}
