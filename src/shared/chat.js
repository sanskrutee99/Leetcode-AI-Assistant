import { SYSTEM_PROMPT } from "./constants.js";
import { getProblemContext } from "./problemContext.js";

export function buildGroqMessages(conversationHistory, userText) {
  const { title, description } = getProblemContext();
  const problemBlock =
    title || description
      ? `Current LeetCode problem:\nTitle: ${title || "(unknown)"}\n\nDescription:\n${description || "(not detected — scroll the problem if needed)"}`
      : "Current LeetCode problem context was not detected on this page.";

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (conversationHistory.length === 0) {
    messages.push({ role: "user", content: problemBlock });
    messages.push({
      role: "assistant",
      content:
        "I have the problem context. Ask for hints, approach ideas, or explanations.",
    });
  }

  for (const turn of conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: "user", content: userText });
  return messages;
}
