import type { ReactNode } from "react";

type PanelProps = {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <section
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? (
        <h2 className="mb-4 text-lg font-bold leading-[26px] text-[var(--text-primary)]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
