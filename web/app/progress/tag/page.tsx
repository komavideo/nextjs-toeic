import { Suspense } from "react";
import { TagDetailClient } from "@/components/progress/TagDetailClient";
import { getAllQuestionBankEntries } from "@/lib/question-bank";
import { flattenQuestionBankEntries } from "@/lib/question-bank/flatten";

export default function ProgressTagPage() {
  const questions = flattenQuestionBankEntries(getAllQuestionBankEntries()).map(
    (question) => ({
      questionId: question.questionId,
      part: question.part,
      sentence: question.sentence,
      title: question.title,
      prompt: question.prompt,
      tags: question.tags,
    }),
  );

  return (
    <Suspense fallback={<div>タグ詳細を読み込んでいます。</div>}>
      <TagDetailClient questions={questions} />
    </Suspense>
  );
}
