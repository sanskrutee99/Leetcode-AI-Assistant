import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "../components/MessageBubble.jsx";
import { ApiKeySettings } from "../components/ApiKeySettings.jsx";
import { buildGroqMessages } from "../shared/chat.js";
import {
  CLEARED_MESSAGE,
  WELCOME_MESSAGE,
} from "../shared/constants.js";
import { groqChatCompletion } from "../shared/groq.js";
import { getGroqApiKey } from "../shared/storage.js";

const IDS = {
  settingsBtn: "leetcode-ai-settings-btn",
  settingsPanel: "leetcode-ai-settings-panel",
};

function createMessage(overrides) {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text: "",
    ...overrides,
  };
}

function setSettingsVisible(visible) {
  const panel = document.getElementById(IDS.settingsPanel);
  const btn = document.getElementById(IDS.settingsBtn);
  if (!panel) return;

  panel.style.display = visible ? "block" : "none";
  panel.dataset.open = visible ? "true" : "false";
  if (btn) btn.setAttribute("aria-expanded", visible ? "true" : "false");
}

function toggleSettingsPanel() {
  const panel = document.getElementById(IDS.settingsPanel);
  if (!panel) return;
  const isOpen = panel.dataset.open === "true";
  setSettingsVisible(!isOpen);
}

export function ContentApp() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [messages, setMessages] = useState([
    createMessage({ text: WELCOME_MESSAGE }),
  ]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const refreshApiKey = useCallback(async () => {
    const key = await getGroqApiKey();
    setHasApiKey(Boolean(key));
  }, []);

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  useEffect(() => {
    refreshApiKey();
  }, [refreshApiKey]);

  useEffect(() => {
    if (panelOpen) refreshApiKey();
  }, [panelOpen, refreshApiKey]);

  useEffect(() => {
    if (!hasApiKey && panelOpen) openSettings();
  }, [hasApiKey, panelOpen, openSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** Native listeners — LeetCode blocks React synthetic clicks on some controls */
  useEffect(() => {
    if (!panelOpen) return;

    const btn = document.getElementById(IDS.settingsBtn);
    const panel = document.getElementById(IDS.settingsPanel);

    if (!btn) return;

    const onSettingsClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toggleSettingsPanel();
    };

    btn.addEventListener("click", onSettingsClick, true);
    btn.addEventListener("mousedown", onSettingsClick, true);

    return () => {
      btn.removeEventListener("click", onSettingsClick, true);
      btn.removeEventListener("mousedown", onSettingsClick, true);
    };
  }, [panelOpen]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function handleSend() {
    const userText = input.trim();
    if (!userText || isLoading) return;

    const apiKey = await getGroqApiKey();
    if (!apiKey) {
      openSettings();
      setHasApiKey(false);
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "user", text: userText }),
        createMessage({
          text: "Add your Groq API key in Settings above (or via the extension popup), then try again.",
          isError: true,
        }),
      ]);
      setInput("");
      return;
    }

    const typingId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", text: userText }),
      createMessage({ id: typingId, typing: true }),
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const groqMessages = buildGroqMessages(conversationHistory, userText);
      const reply = await groqChatCompletion(apiKey, groqMessages);

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: reply },
      ]);

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat(createMessage({ text: reply }))
      );
    } catch (err) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat(
            createMessage({
              text: err.message || "Something went wrong.",
              isError: true,
            })
          )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setConversationHistory([]);
    setMessages([createMessage({ text: CLEARED_MESSAGE })]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <button
        type="button"
        className="fab"
        title="Open LeetCode AI Assistant"
        onClick={() => setPanelOpen((open) => !open)}
      >
        AI
      </button>

      <aside className={`panel ${panelOpen ? "open" : ""}`}>
        <header className="panel-header">
          <h2>LeetCode AI</h2>
          <div className="panel-actions">
            <button
              type="button"
              id={IDS.settingsBtn}
              className="settings-btn"
              aria-expanded="true"
              aria-controls={IDS.settingsPanel}
            >
              Settings
            </button>
            <button type="button" className="ghost" onClick={handleClear}>
              Clear
            </button>
          </div>
        </header>

        {!hasApiKey && (
          <div
            className="key-banner"
            role="button"
            tabIndex={0}
            onClick={openSettings}
            onKeyDown={(e) => e.key === "Enter" && openSettings()}
          >
            No Groq API key saved. Click here or open <strong>Settings</strong>{" "}
            to add one.
          </div>
        )}

        <div
          id={IDS.settingsPanel}
          className="panel-settings"
          style={{ display: "block" }}
          data-open="true"
        >
          <ApiKeySettings variant="panel" onSaved={refreshApiKey} />
        </div>

        <div className="messages">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="composer">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a hint or explain the approach…"
            disabled={isLoading}
          />
          <button
            type="button"
            className="send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? "Sending…" : "Send"}
          </button>
        </footer>
      </aside>
    </>
  );
}
