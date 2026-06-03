import { FormattedMessage } from "./FormattedMessage.jsx";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`message-bubble ${isUser ? "user" : "assistant"} ${
        message.isError ? "error" : ""
      }`}
    >
      {message.typing ? (
        <span className="typing-indicator">Thinking…</span>
      ) : (
        <FormattedMessage text={message.text} />
      )}
    </div>
  );
}
