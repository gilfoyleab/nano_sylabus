import type { ReactNode } from "react";

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "mono";
  className?: string;
}) {
  const styles = {
    default: "bg-bg-tertiary text-text-primary",
    outline: "border border-border text-text-secondary",
    success: "bg-[color:var(--note-green)] text-[color:var(--green)]",
    warning: "bg-[color:var(--note-yellow)] text-[color:var(--yellow)]",
    danger: "bg-[color:var(--note-red)] text-[color:var(--red)]",
    mono: "font-mono-ui border border-border text-text-secondary",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
