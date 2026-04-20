import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label?: string;
  error?: string;
  hint?: string;
};

export function Field({
  label,
  error,
  hint,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean },
) {
  const { className = "", invalid, ...rest } = props;
  return (
    <input
      {...rest}
      className={
        "block w-full rounded-md border bg-bg-primary px-3 h-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-strong/40 " +
        (invalid ? "border-destructive " : "border-border ") +
        className
      }
    />
  );
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={
        "block w-full rounded-md border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-strong/40 " +
        className
      }
    />
  );
}
