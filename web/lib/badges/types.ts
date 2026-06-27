import type { ToeicReadingPart } from "@/types/question";

// バッジのカテゴリ（軸）。継続・演習量・到達・定着・精度・特別の6軸。
export type BadgeCategory =
  | "streak"
  | "volume"
  | "reach"
  | "mastery"
  | "accuracy"
  | "special";

// レア度。見た目の格付けに使う（色分けは UI 側で CSS トークンに対応付ける）。
export type BadgeRarity = "common" | "rare" | "legendary";

// マイルストーン系バッジの進捗（現在値 / 目標値）。
export type BadgeProgress = {
  current: number;
  target: number;
};

// 進捗状態から一度だけ算出する、バッジ判定用の派生指標。
export type BadgeMetrics = {
  currentStreakDays: number;
  totalAnswered: number;
  totalCorrect: number;
  cumulativeAccuracy: number; // 整数 %、0問時は 0
  distinctAnswered: number; // 重複を除いた回答済み問題数
  answeredByPart: Record<ToeicReadingPart, number>; // Part 別の回答済み問題数
  answeredPartCount: number; // 1問以上回答した Part 数
  masteredCount: number; // 回答済みかつ SRS スケジュール外（定着済み）
  perfectSessionCount: number; // セッション近似での全問正解回数
  overcameWeakTag: boolean; // 苦手タグ克服の達成有無
  hasEarlyMorningAnswer: boolean; // 早朝(5〜8時台)の回答有無
  hasLateNightAnswer: boolean; // 深夜(22時〜翌4時台)の回答有無
};

// バッジ定義。判定（isUnlocked）と進捗（getProgress）はメトリクスの純粋関数。
// special など単発条件のバッジは getProgress を持たない（UI は条件文のみ表示）。
export type BadgeDefinition = {
  id: string;
  category: BadgeCategory;
  title: string;
  description: string;
  rarity: BadgeRarity;
  isUnlocked: (metrics: BadgeMetrics) => boolean;
  getProgress?: (metrics: BadgeMetrics) => BadgeProgress;
};

// 一覧表示用に、定義へ解除状態・解除日時・未獲得時の進捗を合成したビュー。
export type BadgeView = {
  definition: BadgeDefinition;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: BadgeProgress;
};
