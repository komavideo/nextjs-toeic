import type { ProgressState, SrsState } from "@/types/progress";

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDueSrsItems(
  srs: ProgressState["srs"],
  today = toDateKey(new Date()),
): SrsState[] {
  return Object.values(srs)
    .filter((item) => item.dueDate <= today)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}
