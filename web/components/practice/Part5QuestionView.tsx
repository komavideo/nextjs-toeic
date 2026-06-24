"use client";

import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { ChoiceId } from "@/types/question";
import { ChoiceList } from "./ChoiceList";
import { FixedActionBar } from "./FixedActionBar";

type Part5QuestionViewProps = {
  question: FlatQuestion;
  selectedChoiceId?: ChoiceId;
  onSelect: (choiceId: ChoiceId) => void;
  onSubmit: () => void;
};

export function Part5QuestionView({
  question,
  selectedChoiceId,
  onSelect,
  onSubmit,
}: Part5QuestionViewProps) {
  return (
    <Panel
      className="mt-6"
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>Part 5</span>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {question.difficulty}
          </span>
        </span>
      }
    >
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

      <p className="text-lg font-medium leading-[30px]">{question.sentence}</p>
      <p className="mt-4 text-base leading-[26px] text-[var(--text-secondary)]">
        {question.prompt}
      </p>

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
    </Panel>
  );
}
