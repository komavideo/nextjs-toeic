import type { ProgressState, SrsState } from "@/types/progress";

// SRS 復習予定を期限で分類したグループ。
// overdue=期限切れ（今日より前）、today=今日、future=明日以降。
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

// 各復習予定の dueDate を today（日付キー文字列）と比較し、
// 期限切れ（< today）／今日（=== today）／明日以降（> today）に分類し、各グループを日付昇順で返す。
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

// 期限到来（期限切れ＋今日）の復習予定を日付順に返す。明日以降は含めない。
export function getDueSrsItems(
  srs: ProgressState["srs"],
  today = toDateKey(new Date()),
): SrsState[] {
  const groups = getSrsDueDateGroups(srs, today);

  return [...groups.overdue, ...groups.today];
}

// 分類済みグループから「復習対象（期限到来）件数」を求める。
// 「期限到来 = 期限切れ＋今日」の定義を 1 箇所に集約するためのヘルパ。
export function countDueSrsItems(groups: SrsDueDateGroups): number {
  return groups.overdue.length + groups.today.length;
}
