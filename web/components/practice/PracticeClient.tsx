"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/shared/Modal";
import {
  bookmarkSaveErrorMessage,
  toggleBookmarkedQuestionId,
} from "@/lib/progress/bookmarks";
import { recordAnswer } from "@/lib/progress/recordAnswer";
import { gradeQuestion } from "@/lib/question-bank/grade";
import {
  defaultSessionQuestionCount,
  findFirstPartByTag,
  getSessionQuestionCountForPart,
  createBookmarkSessionQueue,
  createPartSessionQueue,
  createQuickSessionQueue,
  createReviewSessionQueue,
  createWeaknessSessionQueue,
  parseSessionQuestionCount,
  type SessionQuestionCount,
} from "@/lib/question-bank/sessionQueue";
import { updateSrsState } from "@/lib/srs/updateSrs";
import {
  loadProgressState,
  saveProgressState,
} from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import type {
  ActivePracticeSession,
  PracticeSessionCondition,
  PracticeState,
  SelectPracticeState,
} from "./sessionTypes";
import type { Difficulty, ToeicReadingPart } from "@/types/question";
import { PartSelector } from "./PartSelector";
import { ExplanationView } from "./ExplanationView";
import { Part5QuestionView } from "./Part5QuestionView";
import { PassageQuestionView } from "./PassageQuestionView";
import { PracticeErrorView } from "./PracticeErrorView";
import { PracticeHeader } from "./PracticeHeader";
import { SessionResultView } from "./SessionResultView";

const validParts: ToeicReadingPart[] = ["part5", "part6", "part7"];
const validDifficulties: Difficulty[] = ["easy", "medium", "hard"];

function toPart(value: string | null): ToeicReadingPart | undefined {
  return validParts.find((part) => part === value);
}

function toDifficulty(value: string | null): Difficulty | undefined {
  return validDifficulties.find((difficulty) => difficulty === value);
}

function isUnansweredPriority(value: string | null): boolean {
  return value === "1" || value === "true";
}

function loadOptionalProgressState(): ProgressState | undefined {
  const progressResult = loadProgressState();

  return progressResult.ok ? progressResult.state : undefined;
}

function loadOptionalBookmarkedQuestionIds(): string[] {
  return loadOptionalProgressState()?.bookmarkedQuestionIds ?? [];
}

function createSession(
  part: ToeicReadingPart,
  progressState?: ProgressState,
  questionCount: SessionQuestionCount = defaultSessionQuestionCount,
): ActivePracticeSession {
  const startedAt = new Date().toISOString();
  const effectiveQuestionCount = getSessionQuestionCountForPart(part, questionCount);

  return {
    id: `session-${Date.now()}`,
    condition: {
      kind: "quick",
      part,
      ...(effectiveQuestionCount !== undefined
        ? { questionCount: effectiveQuestionCount }
        : {}),
    },
    queue: createQuickSessionQueue(part, {
      progressState,
      questionCount: effectiveQuestionCount,
    }),
    currentIndex: 0,
    startedAt,
    questionStartedAt: startedAt,
    answers: [],
  };
}

function createPartSession(
  condition: {
    part: ToeicReadingPart;
    difficulty?: Difficulty;
    tag?: string;
    questionCount?: SessionQuestionCount;
    requiresProgressState?: boolean;
  },
  progressState?: ProgressState,
): ActivePracticeSession {
  const startedAt = new Date().toISOString();
  const effectiveQuestionCount = getSessionQuestionCountForPart(
    condition.part,
    condition.questionCount,
  );

  return {
    id: `session-${Date.now()}`,
    condition: {
      kind: "part",
      part: condition.part,
      difficulty: condition.difficulty,
      tag: condition.tag,
      requiresProgressState: condition.requiresProgressState,
      ...(effectiveQuestionCount !== undefined
        ? { questionCount: effectiveQuestionCount }
        : {}),
    },
    queue: createPartSessionQueue({
      part: condition.part,
      difficulty: condition.difficulty,
      tag: condition.tag,
      progressState,
      questionCount: effectiveQuestionCount,
    }),
    currentIndex: 0,
    startedAt,
    questionStartedAt: startedAt,
    answers: [],
  };
}

function createReviewSession(progressState: ProgressState): ActivePracticeSession {
  const startedAt = new Date().toISOString();

  return {
    id: `session-${Date.now()}`,
    condition: { kind: "review" },
    queue: createReviewSessionQueue(progressState),
    currentIndex: 0,
    startedAt,
    questionStartedAt: startedAt,
    answers: [],
  };
}

function createBookmarkSession(
  progressState: ProgressState,
): ActivePracticeSession {
  const startedAt = new Date().toISOString();

  return {
    id: `session-${Date.now()}`,
    condition: { kind: "bookmark" },
    queue: createBookmarkSessionQueue(progressState),
    currentIndex: 0,
    startedAt,
    questionStartedAt: startedAt,
    answers: [],
  };
}

function createWeaknessSession(progressState: ProgressState): ActivePracticeSession {
  const startedAt = new Date().toISOString();

  return {
    id: `session-${Date.now()}`,
    condition: { kind: "weakness" },
    queue: createWeaknessSessionQueue(progressState),
    currentIndex: 0,
    startedAt,
    questionStartedAt: startedAt,
    answers: [],
  };
}

function createRestartedSessionState(
  condition: PracticeSessionCondition,
): PracticeState {
  if (condition.kind === "review") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "復習データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(createReviewSession(progressResult.state));
  }

  if (condition.kind === "bookmark") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "ブックマークデータを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createBookmarkSession(progressResult.state),
    );
  }

  if (condition.kind === "weakness") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "弱点データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createWeaknessSession(progressResult.state),
    );
  }

  if (condition.kind === "part") {
    const progressResult = condition.requiresProgressState
      ? loadProgressState()
      : undefined;

    if (progressResult && !progressResult.ok) {
      return {
        screen: "error",
        message: "未回答データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createPartSession(
        {
          part: condition.part ?? "part5",
          difficulty: condition.difficulty,
          tag: condition.tag,
          questionCount: condition.questionCount,
          requiresProgressState: condition.requiresProgressState,
        },
        progressResult?.state ?? loadOptionalProgressState(),
      ),
    );
  }

  return createRunnableSessionState(
    createSession(
      condition.part ?? "part5",
      loadOptionalProgressState(),
      condition.questionCount,
    ),
  );
}

function createSelectStateFromCondition(
  condition: PracticeSessionCondition,
): SelectPracticeState {
  return {
    screen: "select",
    initialPart: condition.part,
    initialDifficulty: condition.difficulty,
    initialTag: condition.tag,
    initialQuestionCount: condition.questionCount,
  };
}

function createRunnableSessionState(
  session: ActivePracticeSession,
): SelectPracticeState | { screen: "question"; session: ActivePracticeSession } {
  if (session.queue.length === 0) {
    return createSelectStateFromCondition(session.condition);
  }

  return { screen: "question", session };
}

function createSelectStateFromSearchParams(
  searchParams: URLSearchParams,
): SelectPracticeState {
  const tag = searchParams.get("tag") ?? undefined;

  return {
    screen: "select",
    initialPart:
      toPart(searchParams.get("part")) ?? (tag ? findFirstPartByTag(tag) : undefined),
    initialDifficulty: toDifficulty(searchParams.get("difficulty")),
    initialTag: tag,
    initialQuestionCount: parseSessionQuestionCount(searchParams.get("count")),
  };
}

function createPracticeStateFromSearchParams(
  searchParams: URLSearchParams,
): PracticeState {
  const mode = searchParams.get("mode");
  const part = toPart(searchParams.get("part")) ?? "part5";
  const questionCount = parseSessionQuestionCount(searchParams.get("count"));
  const requiresProgressState = isUnansweredPriority(searchParams.get("unanswered"));

  if (mode === "quick") {
    return createRunnableSessionState(
      createSession(part, loadOptionalProgressState(), questionCount),
    );
  }

  if (mode === "part") {
    const progressResult = loadProgressState();

    if (requiresProgressState && !progressResult.ok) {
      return {
        screen: "error",
        message: "未回答データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createPartSession(
        {
          part,
          difficulty: toDifficulty(searchParams.get("difficulty")),
          tag: searchParams.get("tag") ?? undefined,
          questionCount,
          requiresProgressState,
        },
        progressResult.ok ? progressResult.state : undefined,
      ),
    );
  }

  if (mode === "review") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "復習データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    const reviewSession = createReviewSession(progressResult.state);

    return createRunnableSessionState(reviewSession);
  }

  if (mode === "bookmark") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "ブックマークデータを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createBookmarkSession(progressResult.state),
    );
  }

  if (mode === "weakness") {
    const progressResult = loadProgressState();

    if (!progressResult.ok) {
      return {
        screen: "error",
        message: "弱点データを読み込めませんでした。",
        storageUnavailable: progressResult.reason === "unavailable",
      };
    }

    return createRunnableSessionState(
      createWeaknessSession(progressResult.state),
    );
  }

  return createSelectStateFromSearchParams(searchParams);
}

export function PracticeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();
  const [state, setState] = useState<PracticeState>(() =>
    createSelectStateFromSearchParams(new URLSearchParams(searchParamKey)),
  );
  // 静的エクスポートのハイドレーション不整合と render 中の副作用（v1→v2 移行書き込み）を
  // 避けるため、初期値は空配列にしてマウント後の useEffect で localStorage から読み込む。
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<string[]>(
    [],
  );
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(
    null,
  );
  const [interruptRequested, setInterruptRequested] = useState(false);
  const sessionActive =
    state.screen === "question" || state.screen === "explain";

  useEffect(() => {
    setState(
      createPracticeStateFromSearchParams(new URLSearchParams(searchParamKey)),
    );
    setBookmarkedQuestionIds(loadOptionalBookmarkedQuestionIds());
    // 新しいセッションへ遷移したら、前セッションのブックマーク保存エラーは持ち越さない。
    setBookmarkError(null);
  }, [searchParamKey]);

  useEffect(() => {
    window.__toeicPracticeSessionActive = sessionActive;

    return () => {
      window.__toeicPracticeSessionActive = false;
    };
  }, [sessionActive]);

  useEffect(() => {
    function handleNavigationRequest(event: Event) {
      const customEvent = event as CustomEvent<{ href?: string }>;

      if (!sessionActive) {
        if (customEvent.detail?.href) {
          router.push(customEvent.detail.href);
        }
        return;
      }

      setPendingNavigationHref(customEvent.detail?.href ?? null);
      setInterruptRequested(true);
    }

    window.addEventListener("toeic:navigation-request", handleNavigationRequest);

    return () => {
      window.removeEventListener(
        "toeic:navigation-request",
        handleNavigationRequest,
      );
    };
  }, [router, sessionActive]);

  function cancelInterrupt() {
    setInterruptRequested(false);
    setPendingNavigationHref(null);
  }

  function confirmInterrupt() {
    const href = pendingNavigationHref;
    setInterruptRequested(false);
    setPendingNavigationHref(null);

    if (href) {
      window.__toeicPracticeSessionActive = false;
      router.push(href);
      return;
    }

    setState({ screen: "select" });
  }

  function toggleBookmark(questionId: string) {
    const loadResult = loadProgressState();

    if (!loadResult.ok) {
      setBookmarkError(
        bookmarkSaveErrorMessage("load", loadResult.reason === "unavailable"),
      );
      return;
    }

    const nextProgress = toggleBookmarkedQuestionId(loadResult.state, questionId);
    const saveResult = saveProgressState(nextProgress);

    if (!saveResult.ok) {
      setBookmarkError(
        bookmarkSaveErrorMessage("save", saveResult.reason === "unavailable"),
      );
      return;
    }

    setBookmarkedQuestionIds(nextProgress.bookmarkedQuestionIds);
    setBookmarkError(null);
  }

  function submitCurrentAnswer(session: ActivePracticeSession) {
    const currentQuestion = session.queue[session.currentIndex];

    if (!currentQuestion || !session.selectedChoiceId) {
      return;
    }

    const answeredAt = new Date().toISOString();
    const elapsedMs = Math.max(
      new Date(answeredAt).getTime() -
        new Date(session.questionStartedAt).getTime(),
      0,
    );
    const answer = gradeQuestion(
      currentQuestion,
      session.selectedChoiceId,
      elapsedMs,
      answeredAt,
    );
    const progressResult = loadProgressState();
    const srsPreview = updateSrsState({
      questionId: answer.questionId,
      correct: answer.correct,
      currentState: progressResult.ok
        ? progressResult.state.srs[answer.questionId]
        : undefined,
      answeredAt,
    });

    // 新しい解説画面へ入る前に、別問題のブックマーク保存エラーを持ち越さない。
    setBookmarkError(null);
    setState({
      screen: "explain",
      session: {
        ...session,
        answers: [...session.answers, answer],
      },
      answer,
      srsPreview,
    });
  }

  function completeSession(session: ActivePracticeSession) {
    const totalCorrect = session.answers.filter((answer) => answer.correct).length;
    const latestAnswer = session.answers.at(-1);
    const elapsedMs = latestAnswer
      ? Math.max(
          new Date(latestAnswer.answeredAt).getTime() -
            new Date(session.startedAt).getTime(),
          0,
        )
      : 0;

    const loadResult = loadProgressState();

    if (!loadResult.ok) {
      setState({
        screen: "error",
        message:
          loadResult.reason === "unavailable"
            ? "localStorage が利用できないため、進捗を保存できませんでした。"
            : "進捗データを読み込めないため、保存できませんでした。",
        storageUnavailable: loadResult.reason === "unavailable",
        session,
      });
      return;
    }

    let nextProgress = loadResult.state;
    let reviewScheduledCount = 0;

    for (const answer of session.answers) {
      nextProgress = recordAnswer(nextProgress, answer);
      const srsResult = updateSrsState({
        questionId: answer.questionId,
        correct: answer.correct,
        currentState: nextProgress.srs[answer.questionId],
        answeredAt: answer.answeredAt,
      });

      if (srsResult.status === "mastered") {
        const { [srsResult.questionId]: _removed, ...restSrs } = nextProgress.srs;
        nextProgress = { ...nextProgress, srs: restSrs };
      } else {
        // 既に SRS 登録済みの問題は「追加」ではなく再スケジュールのため、
        // 新規に復習予定へ登録される問題のみをカウントする。
        if (!(answer.questionId in nextProgress.srs)) {
          reviewScheduledCount += 1;
        }

        nextProgress = {
          ...nextProgress,
          srs: {
            ...nextProgress.srs,
            [answer.questionId]: srsResult.state,
          },
        };
      }
    }

    const saveResult = saveProgressState(nextProgress);

    if (!saveResult.ok) {
      setState({
        screen: "error",
        message:
          saveResult.reason === "unavailable"
            ? "localStorage が利用できないため、進捗を保存できませんでした。"
            : "進捗データの保存に失敗しました。",
        storageUnavailable: saveResult.reason === "unavailable",
        session,
      });
      return;
    }

    setBookmarkedQuestionIds(nextProgress.bookmarkedQuestionIds);
    setState({
      screen: "result",
      session,
      totalAnswered: session.answers.length,
      totalCorrect,
      elapsedMs,
      reviewScheduledCount,
    });
  }

  function moveNextFromExplanation(session: ActivePracticeSession) {
    // 解説画面を離れる時点で、この問題のブックマーク保存エラーをクリアし、
    // 次の問題の解説画面や結果画面へ持ち越さない。
    setBookmarkError(null);
    const nextIndex = session.currentIndex + 1;

    if (nextIndex < session.queue.length) {
      setState({
        screen: "question",
        session: {
          ...session,
          currentIndex: nextIndex,
          selectedChoiceId: undefined,
          questionStartedAt: new Date().toISOString(),
        },
      });
      return;
    }

    completeSession(session);
  }

  const interruptModal = (
    <Modal
      description="現在のセッションは保存されません。中断してもよろしいですか。"
      onClose={cancelInterrupt}
      onPrimary={confirmInterrupt}
      onSecondary={cancelInterrupt}
      open={interruptRequested}
      primaryLabel="中断する"
      secondaryLabel="続ける"
      title="セッションを中断しますか"
    />
  );

  if (state.screen === "question") {
    const currentQuestion = state.session.queue[state.session.currentIndex];

    return (
      <>
        <section className="mx-auto max-w-[720px]">
          <PracticeHeader
            currentIndex={state.session.currentIndex}
            onInterrupt={() => setInterruptRequested(true)}
            part={state.session.condition.part ?? currentQuestion?.part ?? "part5"}
            totalCount={state.session.queue.length}
          />
          {currentQuestion ? (
            currentQuestion.part === "part5" ? (
              <Part5QuestionView
                onSelect={(choiceId) =>
                  setState({
                    screen: "question",
                    session: { ...state.session, selectedChoiceId: choiceId },
                  })
                }
                onSubmit={() => submitCurrentAnswer(state.session)}
                question={currentQuestion}
                selectedChoiceId={state.session.selectedChoiceId}
              />
            ) : (
              <PassageQuestionView
                currentIndex={state.session.currentIndex}
                onSelect={(choiceId) =>
                  setState({
                    screen: "question",
                    session: { ...state.session, selectedChoiceId: choiceId },
                  })
                }
                onSubmit={() => submitCurrentAnswer(state.session)}
                question={currentQuestion}
                selectedChoiceId={state.session.selectedChoiceId}
                totalCount={state.session.queue.length}
              />
            )
          ) : (
            <p className="mt-4 text-[var(--text-secondary)]">
              出題できる問題がありません。
            </p>
          )}
        </section>
        {interruptModal}
      </>
    );
  }

  if (state.screen === "error") {
    return (
      <PracticeErrorView
        message={state.message}
        onInitialized={() => setState({ screen: "select" })}
        onRetry={() => {
          if (state.session) {
            completeSession(state.session);
            return;
          }

          setState(
            createPracticeStateFromSearchParams(
              new URLSearchParams(searchParamKey),
            ),
          );
        }}
        preserveSession={Boolean(state.session)}
        storageUnavailable={state.storageUnavailable}
      />
    );
  }

  if (state.screen === "explain") {
    const currentQuestion = state.session.queue[state.session.currentIndex];

    if (!currentQuestion) {
      return null;
    }

    return (
      <>
        <ExplanationView
          answer={state.answer}
          bookmarkError={bookmarkError}
          bookmarked={bookmarkedQuestionIds.includes(currentQuestion.questionId)}
          onNext={() => moveNextFromExplanation(state.session)}
          onToggleBookmark={() => toggleBookmark(currentQuestion.questionId)}
          question={currentQuestion}
          srsPreview={state.srsPreview}
        />
        {interruptModal}
      </>
    );
  }

  if (state.screen === "result") {
    return (
      <SessionResultView
        answers={state.session.answers}
        bookmarkError={bookmarkError}
        bookmarkedQuestionIds={bookmarkedQuestionIds}
        elapsedMs={state.elapsedMs}
        onRestart={() =>
          setState(createRestartedSessionState(state.session.condition))
        }
        onToggleBookmark={toggleBookmark}
        reviewScheduledCount={state.reviewScheduledCount}
        totalAnswered={state.totalAnswered}
        totalCorrect={state.totalCorrect}
      />
    );
  }

  if (state.screen !== "select") {
    return null;
  }

  return (
    <>
      <PartSelector
        initialDifficulty={state.initialDifficulty}
        initialPart={state.initialPart}
        initialQuestionCount={state.initialQuestionCount}
        initialTag={state.initialTag}
        key={[
          state.initialPart ?? "part5",
          state.initialDifficulty ?? "",
          state.initialTag ?? "",
          state.initialQuestionCount ?? defaultSessionQuestionCount,
        ].join(":")}
        onStart={(condition) =>
          setState(
            createRunnableSessionState(
              createPartSession(condition, loadOptionalProgressState()),
            ),
          )
        }
      />
      {interruptModal}
    </>
  );
}
