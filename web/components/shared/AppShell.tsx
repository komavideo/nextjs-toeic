import type { ReactNode } from "react";
import { AppNavigation } from "./AppNavigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1360px]">
        <aside className="hidden w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6 md:block">
          <div className="mb-8 text-lg font-bold leading-[26px]">
            5分リーディングドリル
          </div>
          <AppNavigation placement="side" />
        </aside>
        <main className="min-w-0 flex-1 px-5 py-6 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[var(--shadow-panel)] md:hidden">
        <AppNavigation placement="bottom" />
      </div>
    </div>
  );
}
