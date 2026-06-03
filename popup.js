const viewReady = document.getElementById("view-ready");
const viewSetup = document.getElementById("view-setup");
const apiKeyInput = document.getElementById("api-key");
const form = document.getElementById("api-key-form");
const statusSetup = document.getElementById("status-setup");
const statusReady = document.getElementById("status-ready");
const readyKeyEl = document.getElementById("ready-key");

function showReady(key) {
  viewSetup.hidden = true;
  viewReady.hidden = false;
  readyKeyEl.textContent = maskApiKey(key);
  statusReady.textContent = "";
  statusReady.className = "status info";
}

function showSetup(message = "", isError = false) {
  viewReady.hidden = true;
  viewSetup.hidden = false;
  if (message) {
    statusSetup.textContent = message;
    statusSetup.className = `status ${isError ? "err" : "info"}`;
  }
}

function setSetupStatus(text, type = "info") {
  statusSetup.textContent = text;
  statusSetup.className = `status ${type}`;
}

function setReadyStatus(text, type = "info") {
  statusReady.textContent = text;
  statusReady.className = `status ${type}`;
}

async function saveAndValidateKey(rawKey) {
  const cleaned = sanitizeApiKey(rawKey);

  if (!cleaned) {
    throw new Error("Enter your Groq API key.");
  }

  if (!isLikelyGroqKey(cleaned)) {
    throw new Error(
      "Invalid format. Groq keys start with gsk_ and are ~50+ characters. Copy from console.groq.com/keys."
    );
  }

  setSetupStatus("Verifying with Groq…", "info");
  const verified = await validateGroqApiKey(cleaned);
  await setGroqApiKey(verified);
  return verified;
}

async function init() {
  try {
    const key = await getGroqApiKey();
    if (!key) {
      showSetup("Paste your Groq API key from console.groq.com/keys");
      return;
    }

    showReady(key);

    try {
      await validateGroqApiKey(key);
    } catch {
      showSetup(
        "Saved key is invalid or expired. Paste a new key from console.groq.com/keys",
        true
      );
      await setGroqApiKey("");
    }
  } catch (err) {
    showSetup(err.message, true);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await saveAndValidateKey(apiKeyInput.value);
    setSetupStatus("Key verified and saved. Closing…", "ok");
    setTimeout(() => window.close(), 500);
  } catch (err) {
    setSetupStatus(err.message, "err");
  }
});

document.getElementById("done-btn").addEventListener("click", () => window.close());

document.getElementById("change-key-btn").addEventListener("click", async () => {
  await setGroqApiKey("");
  showSetup("Paste a new Groq API key.");
  apiKeyInput.value = "";
  apiKeyInput.focus();
});

document.getElementById("test-ready-btn").addEventListener("click", async () => {
  const btn = document.getElementById("test-ready-btn");

  btn.disabled = true;
  setReadyStatus("Testing…", "info");

  try {
    const key = await getGroqApiKey();
    if (!key) {
      showSetup("No key saved.", true);
      return;
    }

    await validateGroqApiKey(key);
    const reply = await groqChatCompletion(key, [
      { role: "user", content: "Reply with exactly: OK" },
    ]);
    setReadyStatus(
      reply.includes("OK") ? "Connection works." : `Connected: ${reply.slice(0, 40)}`,
      "ok"
    );
  } catch (err) {
    setReadyStatus(err.message, "err");
  } finally {
    btn.disabled = false;
  }
});

init();
