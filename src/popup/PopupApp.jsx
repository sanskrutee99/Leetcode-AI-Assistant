import { useEffect, useState } from "react";
import { groqChatCompletion } from "../shared/groq.js";
import {
  getGroqApiKey,
  setGroqApiKey,
  maskApiKey,
} from "../shared/storage.js";

export function PopupApp() {
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [status, setStatus] = useState({ text: "Loading…", type: "info" });
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    const key = await getGroqApiKey();
    if (key) {
      setStatus({ text: `Saved: ${maskApiKey(key)}`, type: "ok" });
    } else {
      setStatus({ text: "No API key saved yet.", type: "info" });
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function handleSave() {
    const key = apiKeyDraft.trim();
    if (!key) {
      setStatus({ text: "Enter a Groq API key first.", type: "err" });
      return;
    }
    await setGroqApiKey(key);
    setApiKeyDraft("");
    await refreshStatus();
    setStatus({ text: "API key saved.", type: "ok" });
  }

  async function handleClear() {
    await setGroqApiKey("");
    setApiKeyDraft("");
    await refreshStatus();
  }

  async function handleTest() {
    const key = apiKeyDraft.trim() || (await getGroqApiKey());
    if (!key) {
      setStatus({ text: "Save an API key before testing.", type: "err" });
      return;
    }

    setBusy(true);
    setStatus({ text: "Testing connection…", type: "info" });

    try {
      const reply = await groqChatCompletion(key, [
        { role: "user", content: "Reply with exactly: OK" },
      ]);
      setStatus({
        text: reply.includes("OK")
          ? "Connection successful."
          : `Connected. Model replied: ${reply.slice(0, 80)}`,
        type: "ok",
      });
    } catch (err) {
      setStatus({ text: err.message || "Test failed.", type: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="popup">
      <h1>LeetCode AI Assistant</h1>
      <p className="subtitle">
        Add your{" "}
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener noreferrer"
        >
          Groq API key
        </a>
        . Stored locally in your browser.
      </p>

      <label htmlFor="api-key">Groq API key</label>
      <input
        id="api-key"
        type="password"
        placeholder="gsk_..."
        value={apiKeyDraft}
        onChange={(e) => setApiKeyDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        autoComplete="off"
        spellCheck={false}
      />

      <div className="row">
        <button
          type="button"
          className="primary"
          onClick={handleSave}
          disabled={busy}
        >
          Save
        </button>
        <button type="button" onClick={handleTest} disabled={busy}>
          Test
        </button>
      </div>
      <button
        type="button"
        className="full"
        onClick={handleClear}
        disabled={busy}
      >
        Remove key
      </button>

      <div className={`status ${status.type}`}>{status.text}</div>

      <p className="subtitle" style={{ marginTop: 14, marginBottom: 0 }}>
        Open a LeetCode problem and use the floating <strong>AI</strong> button.
      </p>
    </div>
  );
}
