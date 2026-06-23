"use client";

import type { Choice, ChoiceId } from "@/types/question";

type ChoiceListProps = {
  choices: Choice[];
  selectedChoiceId?: ChoiceId;
  correctChoiceId?: ChoiceId;
  disabled?: boolean;
  onSelect?: (choiceId: ChoiceId) => void;
};

export function ChoiceList({
  choices,
  selectedChoiceId,
  correctChoiceId,
  disabled = false,
  onSelect,
}: ChoiceListProps) {
  const orderedChoices = [...choices].sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  return (
    <div className="grid gap-3">
      {orderedChoices.map((choice) => {
        const selected = selectedChoiceId === choice.id;
        const correct = correctChoiceId === choice.id;
        const wrongSelected = selected && correctChoiceId && !correct;

        return (
          <button
            aria-pressed={selected}
            className={[
              "flex min-h-[52px] w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors",
              correct
                ? "border-[var(--success)] bg-[var(--success-soft)]"
                : wrongSelected
                  ? "border-[var(--danger)] bg-[var(--danger-soft)]"
                  : selected
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]",
            ].join(" ")}
            disabled={disabled}
            key={choice.id}
            onClick={() => onSelect?.(choice.id)}
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-sm font-bold">
              {choice.id}
            </span>
            <span className="text-base leading-[26px]">{choice.text}</span>
          </button>
        );
      })}
    </div>
  );
}
