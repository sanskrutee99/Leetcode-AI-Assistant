import { formatMessageHtml } from "../shared/formatMessage.js";

export function FormattedMessage({ text }) {
  return (
    <div
      className="formatted-message"
      dangerouslySetInnerHTML={{ __html: formatMessageHtml(text) }}
    />
  );
}
