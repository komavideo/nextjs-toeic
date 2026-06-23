"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onClose: () => void;
};

export function Modal({
  open,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstButton = dialogRef.current?.querySelector("button");
    firstButton?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.36)] px-5">
      <div
        aria-modal="true"
        className="w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]"
        ref={dialogRef}
        role="dialog"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold leading-[26px]">{title}</h2>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onSecondary} variant="secondary">
            {secondaryLabel}
          </Button>
          <Button onClick={onPrimary}>{primaryLabel}</Button>
        </div>
        <button
          aria-label="モーダルを閉じる"
          className="sr-only"
          onClick={onClose}
          type="button"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
