console.log("LeetCode AI Assistant loaded");

let panelOpen = false;

function createUI() {
  if (document.getElementById("ai-assistant-btn")) return;

  // ---------- Floating Button ----------
  const button = document.createElement("button");
  button.id = "ai-assistant-btn";
  button.textContent = "AI";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    border: "1px solid #333",
    fontWeight: "600",
    cursor: "pointer",
    zIndex: "2147483647"
  });

  // ---------- Chat Panel ----------
  const panel = document.createElement("div");
  panel.id = "ai-panel";

  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    right: "-500px",
    width: "500px",
    height: "100%",
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "right 0.3s ease",
    zIndex: "2147483646",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    fontFamily: "system-ui"
  });

  panel.innerHTML = `
    <div style="padding:16px;border-bottom:1px solid #222;display:flex;justify-content:space-between;">
      <span style="font-weight:600;">LeetCode AI</span>
      <button id="clear-chat" style="background:none;border:none;color:#888;cursor:pointer;">Clear</button>
    </div>

    <div id="chat-messages"
      style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
    </div>

    <div style="padding:16px;border-top:1px solid #222;">
      <textarea
        id="chat-input"
        placeholder="Ask for a hint..."
        style="
          width:100%;
          background:#111;
          color:#fff;
          border:1px solid #222;
          padding:10px;
          border-radius:8px;
          resize:none;
          outline:none;
        "
      ></textarea>

      <button
        id="send-btn"
        style="
          margin-top:10px;
          width:100%;
          padding:10px;
          background:#111;
          border:1px solid #333;
          color:#fff;
          border-radius:8px;
          cursor:pointer;
        "
      >
        Send
      </button>
    </div>
  `;

  document.documentElement.appendChild(button);
  document.documentElement.appendChild(panel);

  button.onclick = () => {
    panelOpen = !panelOpen;
    panel.style.right = panelOpen ? "0px" : "-500px";
  };

  document.getElementById("send-btn").onclick = sendMessage;

  document.getElementById("clear-chat").onclick = async () => {
    document.getElementById("chat-messages").innerHTML = "";
    await fetch("http://127.0.0.1:3000/reset", { method: "POST" });
  };

  const textarea = document.getElementById("chat-input");

  // Auto resize
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  // Enter to send
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

function formatMessage(text) {
  return text
    .replace(/```([\s\S]*?)```/g,
      "<pre style='background:#0a0a0a;padding:12px;border-radius:8px;overflow-x:auto;border:1px solid #222;'><code>$1</code></pre>"
    )
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g,
      "<code style='background:#111;padding:2px 4px;border-radius:4px;'>$1</code>"
    );
}

function appendMessage(sender, text) {
  const messages = document.getElementById("chat-messages");

  const bubble = document.createElement("div");
  const isUser = sender === "You";

  Object.assign(bubble.style, {
    alignSelf: isUser ? "flex-end" : "flex-start",
    background: isUser
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.05)",
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "85%",
    border: "1px solid rgba(255,255,255,0.06)",
    lineHeight: "1.5"
  });

  bubble.innerHTML = formatMessage(text);

  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("You", userText);
  input.value = "";

  appendMessage("AI", "Typing...");

  const title =
    document.querySelector("div[data-cy='question-title']")?.innerText || "";
  const description =
    document.querySelector("div[data-track-load='description_content']")
      ?.innerText || "";

  const res = await fetch("http://127.0.0.1:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `
Problem:
Title: ${title}

Description:
${description}

User Question:
${userText}
`
    })
  });

  const data = await res.json();

  const messages = document.getElementById("chat-messages");
  messages.removeChild(messages.lastChild);

  appendMessage("AI", data.reply);
}

window.addEventListener("load", () => {
  setTimeout(createUI, 1200);
});