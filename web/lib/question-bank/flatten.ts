import type {
  Choice,
  ChoiceId,
  Difficulty,
  QuestionBankEntry,
  ToeicReadingPart,
} from "@/types/question";

export type FlatQuestion = {
  questionId: string;
  entryId: string;
  part: ToeicReadingPart;
  sentence?: string;
  passage?: string;
  title?: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: ChoiceId;
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
};

function mergeTags(...tagGroups: string[][]): string[] {
  return Array.from(new Set(tagGroups.flat()));
}

export function flattenQuestionBankEntries(
  entries: QuestionBankEntry[],
): FlatQuestion[] {
  return entries.flatMap((entry): FlatQuestion[] => {
    if (entry.part === "part5") {
      return [
        {
          questionId: entry.id,
          entryId: entry.id,
          part: entry.part,
          sentence: entry.sentence,
          prompt: entry.prompt,
          choices: entry.choices,
          correctChoiceId: entry.correctChoiceId,
          explanation: entry.explanation,
          difficulty: entry.difficulty,
          tags: entry.tags,
        },
      ];
    }

    return entry.questions.map((question) => ({
      questionId: question.id,
      entryId: entry.id,
      part: entry.part,
      passage: entry.passage,
      title: entry.title,
      prompt: question.prompt,
      choices: question.choices,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      difficulty: question.difficulty,
      tags: mergeTags(entry.tags, question.tags),
    }));
  });
}
