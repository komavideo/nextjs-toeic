"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import { getAvailableTagsByPart } from "@/lib/question-bank/sessionQueue";
import type { Difficulty, ToeicReadingPart } from "@/types/question";

type PartSelectorProps = {
  initialPart?: ToeicReadingPart;
  initialDifficulty?: Difficulty;
  initialTag?: string;
  onStart: (condition: {
    part: ToeicReadingPart;
    difficulty?: Difficulty;
    tag?: string;
  }) => void;
};

const partOptions: Array<{
  part: ToeicReadingPart;
  label: string;
  description: string;
  duration: string;
}> = [
  {
    part: "part5",
    label: "Part 5",
    description: "短文穴埋めで文法と語彙を素早く確認します。",
    duration: "約5分",
  },
  {
    part: "part6",
    label: "Part 6",
    description: "短い文章の流れを読みながら設問に答えます。",
    duration: "約6分",
  },
  {
    part: "part7",
    label: "Part 7",
    description: "案内文やメール形式の長文読解を練習します。",
    duration: "約8分",
  },
];

const difficultyOptions: Difficulty[] = ["easy", "medium", "hard"];

export function PartSelector({
  initialPart = "part5",
  initialDifficulty,
  initialTag,
  onStart,
}: PartSelectorProps) {
  const [selectedPart, setSelectedPart] = useState<ToeicReadingPart>(initialPart);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | undefined>(initialDifficulty);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(initialTag);
  const tagOptions = useMemo(() => {
    const tags = getAvailableTagsByPart(selectedPart);

    if (selectedTag && !tags.includes(selectedTag)) {
      return [selectedTag, ...tags];
    }

    return tags;
  }, [selectedPart, selectedTag]);

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">screen-part</p>
      <h1 className="text-2xl font-bold leading-8">Part 選択</h1>
      <p className="mt-2 text-base leading-[26px] text-[var(--text-secondary)]">
        今回解く Part と条件を選んでください。
      </p>

      <div className="mt-6 grid gap-3">
        {partOptions.map((option) => {
          const selected = selectedPart === option.part;
          const recommended = option.part === "part5";

          return (
            <button
              className={[
                "w-full rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 text-left transition-colors",
                selected
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] hover:bg-[var(--surface-subtle)]",
              ].join(" ")}
              key={option.part}
              onClick={() => {
                setSelectedPart(option.part);

                if (
                  selectedTag &&
                  !getAvailableTagsByPart(option.part).includes(selectedTag)
                ) {
                  setSelectedTag(undefined);
                }
              }}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold leading-[26px]">{option.label}</div>
                  <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                    {option.description}
                  </p>
                </div>
                {recommended ? (
                  <span className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-2 py-1 text-xs font-semibold text-[var(--warning)]">
                    おすすめ
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-muted)]">
                <span>{option.duration}</span>
                <span>正答率 0%</span>
              </div>
            </button>
          );
        })}
      </div>

      <Panel className="mt-6" title="条件">
        <div className="grid gap-5">
          <div>
            <div className="mb-2 text-sm font-semibold">難易度</div>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((difficulty) => (
                <button
                  className={[
                    "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                    selectedDifficulty === difficulty
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface)]",
                  ].join(" ")}
                  key={difficulty}
                  onClick={() =>
                    setSelectedDifficulty(
                      selectedDifficulty === difficulty ? undefined : difficulty,
                    )
                  }
                  type="button"
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">タグ</div>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  className={[
                    "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                    selectedTag === tag
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface)]",
                  ].join(" ")}
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() =>
              onStart({
                part: selectedPart,
                difficulty: selectedDifficulty,
                tag: selectedTag,
              })
            }
          >
            この条件で開始
          </Button>
        </div>
      </Panel>
    </section>
  );
}
