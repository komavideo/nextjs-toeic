import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { QuestionBankEntry, ToeicReadingPart } from "@/types/question";

const questionBankEntries = [
  ...(part5Entries as QuestionBankEntry[]),
  ...(part6Entries as QuestionBankEntry[]),
  ...(part7Entries as QuestionBankEntry[]),
];

export function getAllQuestionBankEntries(): QuestionBankEntry[] {
  return [...questionBankEntries];
}

export function getQuestionBankEntriesByPart(
  part: ToeicReadingPart,
): QuestionBankEntry[] {
  return questionBankEntries.filter((entry) => entry.part === part);
}

export function getQuestionBankEntryById(
  entryId: string,
): QuestionBankEntry | undefined {
  return questionBankEntries.find((entry) => entry.id === entryId);
}
