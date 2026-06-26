import { ProgressClient } from "@/components/progress/ProgressClient";
import { getAllQuestionBankEntries } from "@/lib/question-bank";
import { flattenQuestionBankEntries } from "@/lib/question-bank/flatten";

export default function ProgressPage() {
  const questionRefs = flattenQuestionBankEntries(getAllQuestionBankEntries()).map(
    (question) => ({
      questionId: question.questionId,
      part: question.part,
    }),
  );

  return <ProgressClient questionRefs={questionRefs} />;
}
