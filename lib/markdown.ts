function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
}

function inline(value: string): string {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMd(source: string): string {
  const lines = escapeHtml(source).split("\n");
  let output = "";
  let listType: "ol" | "ul" | null = null;

  const flush = () => {
    if (listType) {
      output += `</${listType}>`;
      listType = null;
    }
  };

  for (const raw of lines) {
    if (/^\s*\d+\.\s+/.test(raw)) {
      if (listType !== "ol") {
        flush();
        output += "<ol>";
        listType = "ol";
      }
      output += `<li>${inline(raw.replace(/^\s*\d+\.\s+/, ""))}</li>`;
    } else if (/^\s*[-*]\s+/.test(raw)) {
      if (listType !== "ul") {
        flush();
        output += "<ul>";
        listType = "ul";
      }
      output += `<li>${inline(raw.replace(/^\s*[-*]\s+/, ""))}</li>`;
    } else if (raw.trim() === "") {
      flush();
    } else {
      flush();
      output += `<p>${inline(raw)}</p>`;
    }
  }

  flush();
  return output;
}

export function renderMarkdown(source: string) {
  return renderMd(source);
}
