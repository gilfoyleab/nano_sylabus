import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "filled" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  filled:
    "bg-text-primary text-text-inverse hover:opacity-90 disabled:opacity-50",
  outline:
    "border border-border-strong text-text-primary hover:bg-bg-secondary disabled:opacity-50",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
  danger:
    "border border-destructive text-destructive hover:bg-destructive hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "filled",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
