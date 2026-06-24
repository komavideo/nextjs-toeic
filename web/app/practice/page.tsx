import { Suspense } from "react";
import { PracticeClient } from "@/components/practice/PracticeClient";

export default function PracticePage() {
  return (
    <Suspense fallback={<div>演習を読み込んでいます。</div>}>
      <PracticeClient />
    </Suspense>
  );
}
