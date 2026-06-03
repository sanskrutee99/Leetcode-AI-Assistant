const STORAGE_KEY = "groqApiKey";

export function getGroqApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] || "").trim());
    });
  });
}

export function setGroqApiKey(key) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: (key || "").trim() }, resolve);
  });
}

export function maskApiKey(key) {
  if (!key) return "Not set";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
