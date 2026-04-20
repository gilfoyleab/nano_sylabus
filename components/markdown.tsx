import { renderMarkdown } from "@/lib/markdown";

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      className={
        "text-sm leading-relaxed text-text-primary [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono-ui [&_code]:rounded [&_code]:bg-bg-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&_li]:mt-1 [&_p]:mt-2 first:[&_p]:mt-0 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
