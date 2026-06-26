import type { ProgressState, SrsState } from "@/types/progress";

export type SrsDueDateGroups = {
  overdue: SrsState[];
  today: SrsState[];
  future: SrsState[];
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortByDueDate(items: SrsState[]): SrsState[] {
  return [...items].sort((left, right) =>
    left.dueDate.localeCompare(right.dueDate),
  );
}

export function getSrsDueDateGroups(
  srs: ProgressState["srs"],
  today = toDateKey(new Date()),
): SrsDueDateGroups {
  const groups: SrsDueDateGroups = {
    overdue: [],
    today: [],
    future: [],
  };

  for (const item of Object.values(srs)) {
    if (item.dueDate < today) {
      groups.overdue.push(item);
    } else if (item.dueDate === today) {
      groups.today.push(item);
    } else {
      groups.future.push(item);
    }
  }

  return {
    overdue: sortByDueDate(groups.overdue),
    today: sortByDueDate(groups.today),
    future: sortByDueDate(groups.future),
  };
}

export function getDueSrsItems(
  srs: ProgressState["srs"],
  today = toDateKey(new Date()),
): SrsState[] {
  const groups = getSrsDueDateGroups(srs, today);

  return [...groups.overdue, ...groups.today];
}
