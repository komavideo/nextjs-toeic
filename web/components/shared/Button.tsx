import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";

type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type LinkButtonProps = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type NativeButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--primary)] bg-[var(--primary)] text-white hover:border-[var(--primary-hover)] hover:bg-[var(--primary-hover)]",
  secondary:
    "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]",
  tertiary:
    "border-transparent bg-transparent text-[var(--primary)] hover:bg-[var(--primary-soft)]",
  danger:
    "border-[var(--danger)] bg-[var(--danger)] text-white hover:bg-[#a9322d]",
};

export function Button(props: ButtonProps) {
  const { children, className = "", variant = "primary" } = props;
  const sharedClassName = [
    "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border px-4 py-2 text-sm font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-muted)]",
    variantClassName[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (typeof props.href === "string") {
    const { href, children: _children, className: _className, variant: _variant, ...linkProps } =
      props;

    return (
      <Link className={sharedClassName} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  const {
    children: _children,
    className: _className,
    variant: _variant,
    type,
    ...buttonProps
  } = props;

  return (
    <button className={sharedClassName} type={type ?? "button"} {...buttonProps}>
      {children}
    </button>
  );
}
