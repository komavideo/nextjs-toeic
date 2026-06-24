"use client";

import { useEffect } from "react";

type ToastType = "success" | "warning" | "danger";

type ToastProps = {
  open: boolean;
  message: string;
  type: ToastType;
  durationMs?: number;
  onClose?: () => void;
};

const typeClassName: Record<ToastType, string> = {
  success:
    "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
  warning:
    "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function Toast({
  open,
  message,
  type,
  durationMs = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open || !onClose) {
      return;
    }

    const timerId = window.setTimeout(onClose, durationMs);

    return () => window.clearTimeout(timerId);
  }, [durationMs, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-5 bottom-24 z-50 flex justify-center md:bottom-6">
      <div
        className={[
          "w-full max-w-[480px] rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-semibold leading-5 shadow-[var(--shadow-panel)]",
          typeClassName[type],
        ].join(" ")}
        role={type === "danger" ? "alert" : "status"}
      >
        {message}
      </div>
    </div>
  );
}
