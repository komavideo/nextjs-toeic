"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __toeicPracticeSessionActive?: boolean;
  }
}

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/practice", label: "演習" },
  { href: "/review", label: "復習" },
  { href: "/progress", label: "進捗" },
  { href: "/settings", label: "設定" },
] as const;

type AppNavigationProps = {
  placement?: "side" | "bottom";
};

export function AppNavigation({ placement = "side" }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="主要ナビゲーション">
      <ul
        className={
          placement === "bottom"
            ? "grid grid-cols-5 gap-1"
            : "flex flex-col gap-2"
        }
      >
        {navigationItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold leading-5 transition-colors",
                  placement === "bottom"
                    ? "justify-center border-t-2 text-center"
                    : "border-l-4",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
                ].join(" ")}
                href={item.href}
                onClick={(event) => {
                  if (
                    typeof window !== "undefined" &&
                    window.__toeicPracticeSessionActive &&
                    !active
                  ) {
                    event.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("toeic:navigation-request", {
                        detail: { href: item.href },
                      }),
                    );
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
