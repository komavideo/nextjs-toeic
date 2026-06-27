"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  getSrsDueDateGroups,
  getSrsDueDateSummary,
  type SrsDueDateGroups,
} from "@/lib/srs/due";
import { createBookmarkSessionQueue } from "@/lib/question-bank/sessionQueue";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { AnswerResult, ProgressState } from "@/types/progress";
import { BookmarkReviewList } from "./BookmarkReviewList";
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
  const [questionNotes, setQuestionNotes] = useState<
    ProgressState["questionNotes"]
  >({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<FlatQuestion[]>(
    [],
  );
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
    setQuestionNotes(result.state.questionNotes);
    setBookmarkedQuestions(createBookmarkSessionQueue(result.state));
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
          setQuestionNotes({});
          setBookmarkedQuestions([]);
          setLoadError(null);
        }}
        onRetry={loadReviewProgress}
        storageUnavailable={loadError.storageUnavailable}
        title="復習データエラー"
      />
    );
  }

  const dueDateSummary = getSrsDueDateSummary(dueDateGroups);
  const hasReviewContent =
    dueDateSummary.hasScheduledItems || bookmarkedQuestions.length > 0;

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-review
      </p>
      <h1 className="text-2xl font-bold leading-8">復習</h1>
      <div className="mt-6 grid gap-5">
        {!hasReviewContent ? (
          <ReviewEmptyState />
        ) : (
          <>
            {dueDateSummary.hasScheduledItems ? (
              <>
                <ReviewList
                  answers={answers}
                  dueDateGroups={dueDateGroups}
                  questionNotes={questionNotes}
                />
                {dueDateSummary.hasDueItems ? (
                  <Button className="w-full" href="/practice?mode=review">
                    復習を開始
                  </Button>
                ) : null}
              </>
            ) : null}
            {bookmarkedQuestions.length > 0 ? (
              <>
                <BookmarkReviewList
                  answers={answers}
                  questionNotes={questionNotes}
                  questions={bookmarkedQuestions}
                />
                <Button className="w-full" href="/practice?mode=bookmark">
                  ブックマーク復習を開始
                </Button>
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
