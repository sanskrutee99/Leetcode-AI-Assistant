function sendToBackground(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(
          new Error(
            "Extension background not responding. Reload at chrome://extensions."
          )
        );
        return;
      }
      if (response.ok) resolve(response);
      else reject(new Error(response.error || "Request failed"));
    });
  });
}

/** Verify key with Groq before saving. Returns cleaned key. */
async function validateGroqApiKey(apiKey) {
  const res = await sendToBackground({
    type: "GROQ_VALIDATE_KEY",
    apiKey,
  });
  return res.key;
}

async function groqChatCompletion(apiKey, messages) {
  const res = await sendToBackground({
    type: "GROQ_CHAT",
    apiKey,
    messages,
  });
  return res.reply;
}
