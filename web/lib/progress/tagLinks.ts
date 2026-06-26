import type { ToeicReadingPart } from "@/types/question";

export function buildProgressTagDetailHref(tag: string): string {
  const searchParams = new URLSearchParams({ tag });

  return `/progress/tag?${searchParams.toString()}`;
}

export function buildTagPracticeHref(
  part: ToeicReadingPart,
  tag: string,
): string {
  const searchParams = new URLSearchParams({ mode: "part", part, tag });

  return `/practice?${searchParams.toString()}`;
}
