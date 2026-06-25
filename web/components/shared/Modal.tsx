"use client";

import { useEffect, useId, useRef } from "react";
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
  const titleId = useId();
  const descriptionId = useId();

  // onClose は呼び出し側で毎レンダー再生成されるため、effect の依存に入れると
  // モーダル表示中の親再レンダリングで cleanup→再setup が走り、フォーカス復帰先が
  // ズレる。最新の onClose は ref 経由で参照し、effect は open のみに反応させる。
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    // モーダルを開く直前にフォーカスしていた要素を退避し、閉じたら起点へ戻す。
    const previousActiveElement = document.activeElement;
    // フォーカス可能要素はキー押下のたびに取得し直し、内容の動的変化にも追従する。
    const getFocusableElements = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        ) ?? [],
      );
    getFocusableElements()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      // フォーカス可能要素が無い／1つだけの場合はモーダル外へ抜けないよう留める。
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (focusableElements.length === 1) {
        event.preventDefault();
        firstFocusableElement.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      if (
        previousActiveElement instanceof HTMLElement &&
        document.contains(previousActiveElement)
      ) {
        previousActiveElement.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.36)] px-5">
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]"
        ref={dialogRef}
        role="dialog"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold leading-[26px]" id={titleId}>
            {title}
          </h2>
          {description ? (
            <p
              className="mt-2 text-sm leading-5 text-[var(--text-secondary)]"
              id={descriptionId}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onSecondary} variant="secondary">
            {secondaryLabel}
          </Button>
          <Button onClick={onPrimary}>{primaryLabel}</Button>
        </div>
      </div>
    </div>
  );
}
