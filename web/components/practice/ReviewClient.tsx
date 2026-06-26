"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  countDueSrsItems,
  getSrsDueDateGroups,
  type SrsDueDateGroups,
} from "@/lib/srs/due";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { AnswerResult } from "@/types/progress";
import { ReviewEmptyState } from "./ReviewEmptyState";
import { ReviewList } from "./ReviewList";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

const emptyDueDateGroups: SrsDueDateGroups = {
  overdue: [],
  today: [],
  future: [],
};

export function ReviewClient() {
  const [dueDateGroups, setDueDateGroups] =
    useState<SrsDueDateGroups>(emptyDueDateGroups);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  const loadReviewProgress = useCallback(() => {
    const result = loadProgressState();

    if (!result.ok) {
      setLoadError({
        message: "進捗データを読み込めませんでした。",
        storageUnavailable: result.reason === "unavailable",
      });
      return;
    }

    setDueDateGroups(getSrsDueDateGroups(result.state.srs));
    setAnswers(result.state.answers);
    setLoadError(null);
  }, []);

  useEffect(() => {
    loadReviewProgress();
  }, [loadReviewProgress]);

  if (loadError) {
    return (
      <ErrorState
        message={loadError.message}
        onInitialized={() => {
          setDueDateGroups(emptyDueDateGroups);
          setAnswers([]);
          setLoadError(null);
        }}
        onRetry={loadReviewProgress}
        storageUnavailable={loadError.storageUnavailable}
        title="復習データエラー"
      />
    );
  }

  const dueCount = countDueSrsItems(dueDateGroups);
  const scheduledCount = dueCount + dueDateGroups.future.length;

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-review
      </p>
      <h1 className="text-2xl font-bold leading-8">復習</h1>
      <div className="mt-6">
        {scheduledCount === 0 ? (
          <ReviewEmptyState />
        ) : (
          <>
            <ReviewList answers={answers} dueDateGroups={dueDateGroups} />
            {dueCount > 0 ? (
              <Button className="mt-5 w-full" href="/practice?mode=review">
                復習を開始
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
