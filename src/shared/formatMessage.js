export function formatMessageHtml(text) {
  return text
    .replace(
      /```([\s\S]*?)```/g,
      "<pre><code>$1</code></pre>"
    )
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='inline'>$1</code>");
}
