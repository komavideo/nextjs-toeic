import type { ProgressState, SrsState } from "@/types/progress";

export function getDueSrsItems(
  srs: ProgressState["srs"],
  today = new Date().toISOString().slice(0, 10),
): SrsState[] {
  return Object.values(srs)
    .filter((item) => item.dueDate <= today)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}
