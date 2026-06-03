function buildGroqMessages(conversationHistory, userText) {
  const { title, description } = getProblemContext();
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (conversationHistory.length === 0) {
    const context =
      title || description
        ? `Problem title: ${title || "Unknown"}\n\nProblem description:\n${description || "(not found on page)"}`
        : "Problem context could not be read from this page.";

    messages.push({
      role: "user",
      content: `${context}\n\nMy question: ${userText}`,
    });
  } else {
    for (const turn of conversationHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: "user", content: userText });
  }

  return messages;
}
