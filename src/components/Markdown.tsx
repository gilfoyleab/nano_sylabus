function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}
function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function renderMd(src: string): string {
  const lines = escapeHtml(src).split("\n");
  let out = "";
  let inList: "ol" | "ul" | null = null;
  const flush = () => { if (inList) { out += `</${inList}>`; inList = null; } };
  for (const raw of lines) {
    if (/^\s*\d+\.\s+/.test(raw)) {
      if (inList !== "ol") { flush(); out += "<ol>"; inList = "ol"; }
      out += `<li>${inline(raw.replace(/^\s*\d+\.\s+/, ""))}</li>`;
    } else if (/^\s*[-*]\s+/.test(raw)) {
      if (inList !== "ul") { flush(); out += "<ul>"; inList = "ul"; }
      out += `<li>${inline(raw.replace(/^\s*[-*]\s+/, ""))}</li>`;
    } else if (raw.trim() === "") {
      flush();
    } else {
      flush();
      out += `<p>${inline(raw)}</p>`;
    }
  }
  flush();
  return out;
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      className={
        "text-sm leading-relaxed text-text-primary [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono-ui [&_code]:rounded [&_code]:bg-bg-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&_li]:mt-1 [&_p]:mt-2 first:[&_p]:mt-0 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: renderMd(text) }}
    />
  );
}
