import { useState } from "react";
import { setGroqApiKey, maskApiKey } from "../shared/storage.js";

export function ApiKeySettings({ variant = "panel", onSaved }) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState({ text: "", type: "info" });

  async function handleSave() {
    const key = draft.trim();
    if (!key) {
      setStatus({ text: "Enter your Groq API key.", type: "error" });
      return;
    }

    await setGroqApiKey(key);
    setDraft("");
    setStatus({ text: `Saved (${maskApiKey(key)})`, type: "success" });
    onSaved?.();
  }

  return (
    <div className={`api-key-settings ${variant}`}>
      <p className="settings-label">
        Groq API key{" "}
        <span className="hint">(stored in your browser only)</span>
      </p>
      <input
        type="password"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="gsk_..."
        autoComplete="off"
        spellCheck={false}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <button type="button" className="btn-primary" onClick={handleSave}>
        Save API key
      </button>
      {status.text ? (
        <p className={`settings-status ${status.type}`}>{status.text}</p>
      ) : null}
    </div>
  );
}
