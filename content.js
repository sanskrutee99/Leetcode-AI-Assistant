(function () {
  const ROOT_ID = "leetcode-ai-root";
  let panelOpen = false;
  let isLoading = false;
  let conversationHistory = [];

  function formatMessage(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>");
  }

  function appendMessage(sender, text, options = {}) {
    const list = document.getElementById("lc-ai-messages");
    if (!list) return;

    const bubble = document.createElement("div");
    bubble.className = `lc-ai-msg ${sender === "You" ? "user" : "assistant"}`;
    if (options.isError) bubble.classList.add("error");
    if (options.typing) {
      bubble.classList.add("typing");
      bubble.textContent = "Thinking…";
    } else {
      bubble.innerHTML = formatMessage(text);
    }
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
  }

  function removeTyping() {
    document.querySelector("#lc-ai-messages .typing")?.remove();
  }

  function setSettingsVisible(show) {
    const section = document.getElementById("lc-ai-settings");
    const chip = document.getElementById("lc-ai-key-chip");
    if (section) section.hidden = !show;
    if (chip) chip.hidden = show;
  }

  async function refreshKeyUI() {
    const key = await getGroqApiKey();
    const status = document.getElementById("lc-ai-key-status");
    const chipText = document.getElementById("lc-ai-chip-text");

    if (key) {
      setSettingsVisible(false);
      if (chipText) chipText.textContent = `API key: ${maskApiKey(key)}`;
      if (status) {
        status.textContent = "";
        status.className = "lc-ai-status ok";
      }
    } else {
      setSettingsVisible(true);
      if (chipText) chipText.textContent = "";
      if (status) {
        status.textContent = "Add your Groq API key to use the assistant.";
        status.className = "lc-ai-status warn";
      }
    }
  }

  async function saveApiKeyFromPanel() {
    const input = document.getElementById("lc-ai-api-key-input");
    const status = document.getElementById("lc-ai-key-status");
    const raw = input?.value || "";

    if (!sanitizeApiKey(raw)) {
      if (status) {
        status.textContent = "Enter your Groq API key.";
        status.className = "lc-ai-status err";
      }
      return;
    }

    if (status) {
      status.textContent = "Verifying with Groq…";
      status.className = "lc-ai-status warn";
    }

    try {
      const verified = await validateGroqApiKey(raw);
      await setGroqApiKey(verified);
      input.value = "";
      await refreshKeyUI();
      appendMessage("AI", "API key verified and saved. Ask your question.");
    } catch (err) {
      if (status) {
        status.textContent = err.message;
        status.className = "lc-ai-status err";
      }
    }
  }

  async function sendMessage() {
    if (isLoading) return;

    const input = document.getElementById("lc-ai-chat-input");
    const sendBtn = document.getElementById("lc-ai-send-btn");
    const userText = input?.value?.trim();
    if (!userText) return;

    let apiKey;
    try {
      apiKey = await getGroqApiKey();
    } catch (err) {
      appendMessage("AI", err.message, { isError: true });
      return;
    }

    if (!apiKey) {
      setSettingsVisible(true);
      appendMessage("AI", "Add your Groq API key above (or use the extension popup), then try again.", {
        isError: true,
      });
      return;
    }

    appendMessage("You", userText);
    input.value = "";
    input.style.height = "auto";
    appendMessage("AI", "", { typing: true });
    isLoading = true;
    sendBtn.disabled = true;

    try {
      const messages = buildGroqMessages(conversationHistory, userText);
      const reply = await groqChatCompletion(apiKey, messages);
      removeTyping();
      conversationHistory.push({ role: "user", content: userText });
      conversationHistory.push({ role: "assistant", content: reply });
      appendMessage("AI", reply);
    } catch (err) {
      removeTyping();
      appendMessage("AI", err.message || "Request failed.", { isError: true });
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }

  function clearChat() {
    conversationHistory = [];
    const list = document.getElementById("lc-ai-messages");
    if (list) list.innerHTML = "";
    appendMessage("AI", CLEARED_MESSAGE);
  }

  function injectStyles() {
    if (document.getElementById("lc-ai-styles")) return;
    const style = document.createElement("style");
    style.id = "lc-ai-styles";
    style.textContent = `
      #${ROOT_ID} { font-family: system-ui, sans-serif; }
      #${ROOT_ID} * { box-sizing: border-box; }
      #${ROOT_ID} .lc-ai-fab {
        position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px;
        border-radius: 50%; background: #000; color: #fff; border: 1px solid #333;
        font-weight: 600; cursor: pointer; z-index: 2147483647;
      }
      #${ROOT_ID} .lc-ai-panel {
        position: fixed; top: 0; right: 0; width: min(480px, 100vw); height: 100%;
        background: #0d0d0d; color: #fff; z-index: 2147483646;
        display: flex; flex-direction: column; border-left: 1px solid #333;
        transform: translateX(100%); transition: transform .25s ease;
      }
      #${ROOT_ID} .lc-ai-panel.open { transform: translateX(0); }
      #${ROOT_ID} .lc-ai-header {
        padding: 12px 16px; border-bottom: 1px solid #222;
        display: flex; justify-content: space-between; align-items: center;
      }
      #${ROOT_ID} .lc-ai-header h2 { margin: 0; font-size: 15px; }
      #${ROOT_ID} .lc-ai-header button {
        background: none; border: none; color: #888; cursor: pointer; font-size: 12px;
      }
      #${ROOT_ID} .lc-ai-key-chip {
        padding: 8px 16px; border-bottom: 1px solid #222; font-size: 12px; color: #6ee7a0;
        display: flex; justify-content: space-between; align-items: center;
      }
      #${ROOT_ID} .lc-ai-key-chip button {
        background: none; border: 1px solid #444; color: #ccc; padding: 2px 8px;
        border-radius: 4px; cursor: pointer; font-size: 11px;
      }
      #${ROOT_ID} .lc-ai-settings {
        padding: 12px 16px; border-bottom: 1px solid #222; background: #141414;
      }
      #${ROOT_ID} .lc-ai-settings[hidden] { display: none !important; }
      #${ROOT_ID} .lc-ai-settings label { display: block; font-size: 12px; color: #aaa; margin-bottom: 6px; }
      #${ROOT_ID} .lc-ai-settings input {
        width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #333;
        background: #0a0a0a; color: #fff;
      }
      #${ROOT_ID} .lc-ai-save-key {
        margin-top: 8px; width: 100%; padding: 8px; border: none; border-radius: 8px;
        background: #fff; color: #000; font-weight: 600; cursor: pointer;
      }
      #${ROOT_ID} .lc-ai-status { margin-top: 6px; font-size: 11px; }
      #${ROOT_ID} .lc-ai-status.warn { color: #fcd34d; }
      #${ROOT_ID} .lc-ai-status.err { color: #f87171; }
      #${ROOT_ID} .lc-ai-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      }
      #${ROOT_ID} .lc-ai-msg {
        max-width: 90%; padding: 10px 12px; border-radius: 10px; line-height: 1.45;
        background: #1a1a1a; align-self: flex-start;
      }
      #${ROOT_ID} .lc-ai-msg.user { align-self: flex-end; background: #262626; }
      #${ROOT_ID} .lc-ai-msg.error { color: #fca5a5; border: 1px solid #7f1d1d; }
      #${ROOT_ID} .lc-ai-composer { padding: 12px 16px; border-top: 1px solid #222; }
      #${ROOT_ID} .lc-ai-composer textarea {
        width: 100%; min-height: 44px; padding: 10px; border-radius: 8px;
        border: 1px solid #333; background: #111; color: #fff; resize: none;
      }
      #${ROOT_ID} .lc-ai-send {
        margin-top: 8px; width: 100%; padding: 10px; border: none; border-radius: 8px;
        background: #fff; color: #000; font-weight: 600; cursor: pointer;
      }
      #${ROOT_ID} .lc-ai-send:disabled { opacity: .5; }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    if (document.getElementById(ROOT_ID)) return;
    injectStyles();

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <button type="button" class="lc-ai-fab">AI</button>
      <aside class="lc-ai-panel">
        <div class="lc-ai-header">
          <h2>LeetCode AI</h2>
          <button type="button" id="lc-ai-clear-btn">Clear</button>
        </div>
        <div id="lc-ai-key-chip" class="lc-ai-key-chip" hidden>
          <span id="lc-ai-chip-text"></span>
          <button type="button" id="lc-ai-change-key">Change</button>
        </div>
        <section id="lc-ai-settings" class="lc-ai-settings">
          <label for="lc-ai-api-key-input">Groq API key</label>
          <input type="password" id="lc-ai-api-key-input" placeholder="gsk_..." autocomplete="off" />
          <button type="button" class="lc-ai-save-key" id="lc-ai-save-key-btn">Save API key</button>
          <p id="lc-ai-key-status" class="lc-ai-status warn"></p>
        </section>
        <div id="lc-ai-messages" class="lc-ai-messages"></div>
        <footer class="lc-ai-composer">
          <textarea id="lc-ai-chat-input" rows="2" placeholder="Ask for a hint…"></textarea>
          <button type="button" class="lc-ai-send" id="lc-ai-send-btn">Send</button>
        </footer>
      </aside>
    `;
    document.documentElement.appendChild(root);

    root.querySelector(".lc-ai-fab").addEventListener("click", () => {
      panelOpen = !panelOpen;
      root.querySelector(".lc-ai-panel").classList.toggle("open", panelOpen);
      if (panelOpen) refreshKeyUI();
    });

    document.getElementById("lc-ai-save-key-btn").addEventListener("click", saveApiKeyFromPanel);
    document.getElementById("lc-ai-change-key").addEventListener("click", () => setSettingsVisible(true));
    document.getElementById("lc-ai-clear-btn").addEventListener("click", clearChat);
    document.getElementById("lc-ai-send-btn").addEventListener("click", sendMessage);

    const textarea = document.getElementById("lc-ai-chat-input");
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    document.getElementById("lc-ai-api-key-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveApiKeyFromPanel();
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.groqApiKey) refreshKeyUI();
    });

    appendMessage("AI", WELCOME_MESSAGE);
    refreshKeyUI();
  }

  function init() {
    if (!location.pathname.includes("/problems/")) return;
    createUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 400));
  } else {
    setTimeout(init, 400);
  }

  new MutationObserver(() => {
    if (location.pathname.includes("/problems/") && !document.getElementById(ROOT_ID)) init();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
