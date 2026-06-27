import { questionCountsByPart } from "@/lib/progress/dailyMissions";
import type { BadgeCategory, BadgeDefinition, BadgeMetrics } from "./types.ts";

// 到達・定着の目標値は問題バンク本文を取り込まず、軽量な総設問数だけを再利用する。
const totalQuestions =
  questionCountsByPart.part5 +
  questionCountsByPart.part6 +
  questionCountsByPart.part7;

// カテゴリの表示ラベルと並び順（一覧 UI のセクション順に使う）。
export const badgeCategoryLabels: Record<BadgeCategory, string> = {
  streak: "継続",
  volume: "演習量",
  reach: "到達",
  mastery: "定着",
  accuracy: "精度",
  special: "特別",
};

export const badgeCategoryOrder: BadgeCategory[] = [
  "streak",
  "volume",
  "reach",
  "mastery",
  "accuracy",
  "special",
];

// しきい値到達型バッジ。現在値が目標値以上で解除し、未獲得時は進捗を返す。
function milestoneBadge(params: {
  id: string;
  category: BadgeCategory;
  title: string;
  description: string;
  rarity: BadgeDefinition["rarity"];
  metric: (metrics: BadgeMetrics) => number;
  target: number;
}): BadgeDefinition {
  return {
    id: params.id,
    category: params.category,
    title: params.title,
    description: params.description,
    rarity: params.rarity,
    isUnlocked: (metrics) => params.metric(metrics) >= params.target,
    getProgress: (metrics) => ({
      current: params.metric(metrics),
      target: params.target,
    }),
  };
}

// 精度型バッジ。最小回答数のゲートを満たし、かつ累積正答率が目標%以上で解除する。
function accuracyBadge(params: {
  id: string;
  title: string;
  rarity: BadgeDefinition["rarity"];
  gate: number;
  percent: number;
}): BadgeDefinition {
  return {
    id: params.id,
    category: "accuracy",
    title: params.title,
    description: `${params.gate}問以上回答し、累積正答率${params.percent}%を達成する`,
    rarity: params.rarity,
    isUnlocked: (metrics) =>
      metrics.totalAnswered >= params.gate &&
      metrics.cumulativeAccuracy >= params.percent,
    // 束縛中の条件を進捗に出す。回答数ゲート未達なら回答数進捗、達成後は正答率進捗。
    // これによりロック中は常に current < target となり、満杯バーの矛盾を防ぐ。
    getProgress: (metrics) =>
      metrics.totalAnswered < params.gate
        ? { current: metrics.totalAnswered, target: params.gate }
        : { current: metrics.cumulativeAccuracy, target: params.percent },
  };
}

// 特別（単発条件）型バッジ。進捗バーは持たず、条件文のみを表示する。
function specialBadge(params: {
  id: string;
  title: string;
  description: string;
  rarity: BadgeDefinition["rarity"];
  isUnlocked: (metrics: BadgeMetrics) => boolean;
}): BadgeDefinition {
  return {
    id: params.id,
    category: "special",
    title: params.title,
    description: params.description,
    rarity: params.rarity,
    isUnlocked: params.isUnlocked,
  };
}

export const badgeDefinitions: BadgeDefinition[] = [
  // 継続（連続学習日数）
  milestoneBadge({
    id: "streak-3",
    category: "streak",
    title: "3日継続",
    description: "3日連続で学習する",
    rarity: "common",
    metric: (metrics) => metrics.currentStreakDays,
    target: 3,
  }),
  milestoneBadge({
    id: "streak-7",
    category: "streak",
    title: "1週間継続",
    description: "7日連続で学習する",
    rarity: "rare",
    metric: (metrics) => metrics.currentStreakDays,
    target: 7,
  }),
  milestoneBadge({
    id: "streak-14",
    category: "streak",
    title: "2週間継続",
    description: "14日連続で学習する",
    rarity: "rare",
    metric: (metrics) => metrics.currentStreakDays,
    target: 14,
  }),
  milestoneBadge({
    id: "streak-30",
    category: "streak",
    title: "1ヶ月継続",
    description: "30日連続で学習する",
    rarity: "legendary",
    metric: (metrics) => metrics.currentStreakDays,
    target: 30,
  }),
  // 演習量（累計回答数）
  milestoneBadge({
    id: "volume-10",
    category: "volume",
    title: "ウォームアップ",
    description: "累計10問に回答する",
    rarity: "common",
    metric: (metrics) => metrics.totalAnswered,
    target: 10,
  }),
  milestoneBadge({
    id: "volume-50",
    category: "volume",
    title: "50問突破",
    description: "累計50問に回答する",
    rarity: "common",
    metric: (metrics) => metrics.totalAnswered,
    target: 50,
  }),
  milestoneBadge({
    id: "volume-100",
    category: "volume",
    title: "100問突破",
    description: "累計100問に回答する",
    rarity: "rare",
    metric: (metrics) => metrics.totalAnswered,
    target: 100,
  }),
  milestoneBadge({
    id: "volume-300",
    category: "volume",
    title: "300問突破",
    description: "累計300問に回答する",
    rarity: "rare",
    metric: (metrics) => metrics.totalAnswered,
    target: 300,
  }),
  milestoneBadge({
    id: "volume-1000",
    category: "volume",
    title: "千本ノック",
    description: "累計1000問に回答する",
    rarity: "legendary",
    metric: (metrics) => metrics.totalAnswered,
    target: 1000,
  }),
  // 到達（回答済み問題数）
  milestoneBadge({
    id: "reach-50",
    category: "reach",
    title: "探検開始",
    description: "50問に到達する",
    rarity: "common",
    metric: (metrics) => metrics.distinctAnswered,
    target: 50,
  }),
  milestoneBadge({
    id: "reach-182",
    category: "reach",
    title: "折り返し地点",
    description: "全問題の半分に到達する",
    rarity: "rare",
    metric: (metrics) => metrics.distinctAnswered,
    target: Math.floor(totalQuestions / 2),
  }),
  milestoneBadge({
    id: "reach-part5",
    category: "reach",
    title: "Part 5 制覇",
    description: "Part 5 の全問に到達する",
    rarity: "rare",
    metric: (metrics) => metrics.answeredByPart.part5,
    target: questionCountsByPart.part5,
  }),
  milestoneBadge({
    id: "reach-part6",
    category: "reach",
    title: "Part 6 制覇",
    description: "Part 6 の全問に到達する",
    rarity: "rare",
    metric: (metrics) => metrics.answeredByPart.part6,
    target: questionCountsByPart.part6,
  }),
  milestoneBadge({
    id: "reach-part7",
    category: "reach",
    title: "Part 7 制覇",
    description: "Part 7 の全問に到達する",
    rarity: "rare",
    metric: (metrics) => metrics.answeredByPart.part7,
    target: questionCountsByPart.part7,
  }),
  milestoneBadge({
    id: "reach-all",
    category: "reach",
    title: "全問制覇",
    description: "全問題に到達する",
    rarity: "legendary",
    metric: (metrics) => metrics.distinctAnswered,
    target: totalQuestions,
  }),
  // 定着（SRS をクリアした問題数）
  milestoneBadge({
    id: "mastery-10",
    category: "mastery",
    title: "定着の芽",
    description: "10問を定着させる",
    rarity: "common",
    metric: (metrics) => metrics.masteredCount,
    target: 10,
  }),
  milestoneBadge({
    id: "mastery-50",
    category: "mastery",
    title: "定着名人",
    description: "50問を定着させる",
    rarity: "rare",
    metric: (metrics) => metrics.masteredCount,
    target: 50,
  }),
  milestoneBadge({
    id: "mastery-150",
    category: "mastery",
    title: "定着の達人",
    description: "150問を定着させる",
    rarity: "rare",
    metric: (metrics) => metrics.masteredCount,
    target: 150,
  }),
  milestoneBadge({
    id: "mastery-300",
    category: "mastery",
    title: "ほぼ完全定着",
    description: "300問を定着させる",
    rarity: "legendary",
    metric: (metrics) => metrics.masteredCount,
    target: 300,
  }),
  // 精度（累積正答率 / 全問正解セッション）
  accuracyBadge({
    id: "accuracy-70",
    title: "安定感",
    rarity: "rare",
    gate: 50,
    percent: 70,
  }),
  accuracyBadge({
    id: "accuracy-85",
    title: "高精度",
    rarity: "rare",
    gate: 100,
    percent: 85,
  }),
  accuracyBadge({
    id: "accuracy-95",
    title: "精密機械",
    rarity: "legendary",
    gate: 150,
    percent: 95,
  }),
  milestoneBadge({
    id: "perfect-1",
    category: "accuracy",
    title: "ノーミス",
    description: "全問正解のセッションを1回達成する",
    rarity: "common",
    metric: (metrics) => metrics.perfectSessionCount,
    target: 1,
  }),
  milestoneBadge({
    id: "perfect-5",
    category: "accuracy",
    title: "無双",
    description: "全問正解のセッションを5回達成する",
    rarity: "rare",
    metric: (metrics) => metrics.perfectSessionCount,
    target: 5,
  }),
  milestoneBadge({
    id: "perfect-20",
    category: "accuracy",
    title: "完璧主義",
    description: "全問正解のセッションを20回達成する",
    rarity: "legendary",
    metric: (metrics) => metrics.perfectSessionCount,
    target: 20,
  }),
  // 特別（単発・物語性のある条件）
  specialBadge({
    id: "special-first",
    title: "最初の一歩",
    description: "はじめて問題に回答する",
    rarity: "common",
    isUnlocked: (metrics) => metrics.totalAnswered >= 1,
  }),
  specialBadge({
    id: "special-allparts",
    title: "三冠達成",
    description: "Part 5・6・7 すべてを演習する",
    rarity: "common",
    isUnlocked: (metrics) => metrics.answeredPartCount === 3,
  }),
  specialBadge({
    id: "special-comeback",
    title: "苦手克服",
    description: "苦手なタグを克服する",
    rarity: "rare",
    isUnlocked: (metrics) => metrics.overcameWeakTag,
  }),
  specialBadge({
    id: "special-earlybird",
    title: "朝活ドリル",
    description: "早朝(5〜8時台)に学習する",
    rarity: "common",
    isUnlocked: (metrics) => metrics.hasEarlyMorningAnswer,
  }),
  specialBadge({
    id: "special-nightowl",
    title: "夜の追い込み",
    description: "深夜(22時以降)に学習する",
    rarity: "common",
    isUnlocked: (metrics) => metrics.hasLateNightAnswer,
  }),
];
