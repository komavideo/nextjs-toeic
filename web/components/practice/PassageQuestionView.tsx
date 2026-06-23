"use client";

import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { ChoiceId } from "@/types/question";
import { ChoiceList } from "./ChoiceList";
import { FixedActionBar } from "./FixedActionBar";

type PassageQuestionViewProps = {
  question: FlatQuestion;
  currentIndex: number;
  totalCount: number;
  selectedChoiceId?: ChoiceId;
  onSelect: (choiceId: ChoiceId) => void;
  onSubmit: () => void;
};

export function PassageQuestionView({
  question,
  currentIndex,
  totalCount,
  selectedChoiceId,
  onSelect,
  onSubmit,
}: PassageQuestionViewProps) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
      <Panel title={question.title ?? question.part.toUpperCase()}>
        <a
          className="mb-3 inline-flex text-sm font-semibold text-[var(--primary)]"
          href="#current-question"
        >
          現在の設問へ戻る
        </a>
        <p className="whitespace-pre-line text-base leading-[26px]">
          {question.passage}
        </p>
      </Panel>

      <Panel
        title={
          <span>
            設問 {currentIndex + 1}/{totalCount}
          </span>
        }
      >
        <div id="current-question">
          <div className="mb-4 flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <span
                className="rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-base leading-[26px]">{question.prompt}</p>
          <div className="mt-5">
            <ChoiceList
              choices={question.choices}
              onSelect={onSelect}
              selectedChoiceId={selectedChoiceId}
            />
          </div>
          <FixedActionBar>
            <Button className="w-full" disabled={!selectedChoiceId} onClick={onSubmit}>
              回答する
            </Button>
          </FixedActionBar>
        </div>
      </Panel>
    </div>
  );
}
