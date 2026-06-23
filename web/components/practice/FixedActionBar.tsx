import type { ReactNode } from "react";

type FixedActionBarProps = {
  children: ReactNode;
};

export function FixedActionBar({ children }: FixedActionBarProps) {
  return (
    <div className="mt-5">
      <div className="sticky bottom-20 z-30 border-t border-[var(--border)] bg-[var(--surface)] py-3 shadow-[var(--shadow-panel)] md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="mx-auto max-w-[720px]">{children}</div>
      </div>
    </div>
  );
}
