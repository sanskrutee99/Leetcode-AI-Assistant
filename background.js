const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

function cleanKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") return "";
  return apiKey
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/[\s\u200b-\u200d\uFEFF]/g, "");
}

function authErrorMessage() {
  return (
    "Invalid Groq API key. Open console.groq.com/keys, create a new key (starts with gsk_), " +
    "paste it with no spaces, then save again."
  );
}

async function validateGroqKey(apiKey) {
  const key = cleanKey(apiKey);
  if (!key) throw new Error("No API key provided.");
  if (!key.startsWith("gsk_")) {
    throw new Error(
      "This does not look like a Groq key (must start with gsk_). Copy from console.groq.com/keys."
    );
  }

  const res = await fetch(GROQ_MODELS_URL, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (res.status === 401) {
    throw new Error(authErrorMessage());
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Could not verify key (${res.status})`);
  }

  return key;
}

async function callGroq(apiKey, messages) {
  const key = cleanKey(apiKey);
  if (!key) throw new Error("No API key saved.");

  let lastError = new Error("Groq request failed");

  for (const model of MODELS) {
    const res = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || `Groq API error (${res.status})`;
      lastError = new Error(res.status === 401 ? authErrorMessage() : msg);
      if (res.status === 401) throw lastError;
      continue;
    }

    const text = data?.choices?.[0]?.message?.content;
    if (text) return text;

    lastError = new Error("Empty response from Groq");
  }

  throw lastError;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GROQ_VALIDATE_KEY") {
    validateGroqKey(message.apiKey)
      .then((key) => sendResponse({ ok: true, key }))
      .catch((err) =>
        sendResponse({ ok: false, error: err?.message || "Invalid key" })
      );
    return true;
  }

  if (message?.type === "GROQ_CHAT") {
    callGroq(message.apiKey, message.messages)
      .then((reply) => sendResponse({ ok: true, reply }))
      .catch((err) =>
        sendResponse({ ok: false, error: err?.message || "Request failed" })
      );
    return true;
  }

  return false;
});
